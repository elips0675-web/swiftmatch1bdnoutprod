# План отката (Rollback Plan)

> Актуально: 18.08.2026 (этап 26). Цель: восстановить сервис за <= 15 минут при критичной проблеме в проде (платежи, БД, деплой).

## 1. Общие принципы

- Не деплоить в пятницу вечером. Деплой - будни, до 18:00.
- Каждый деплой = тег/коммит, с которого можно откатиться (git revert или checkout предыдущего тега).
- Перед деплоем с миграциями: сначала `scripts/backup-mysql.ps1` вручную, потом `node database/migrations/migrate.js`.
- Мониторинг: `/health` (app), `/metrics` (Prometheus), Sentry (ошибки), Winston JSON-логи.

## 2. Категории инцидентов

### 2.1. Платёжный флоу сломан (Stripe / подписки / IAP)

**Симптомы:** ошибки checkout, 502 в `/api/premium/*`, webhook 400, жалобы на списания.

**Диагностика (5 мин):**
1. `curl -f http://localhost:3002/health` - жив ли API
2. `grep -i "stripe|webhook|premium" server.log`
3. Проверить STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET в server/.env (не пустые ли после деплоя)

**Действия:**
1. Быстрое отключение платежей без полного отката: feature-флаг premium в админке (проверить, что фронт уважает флаг).
2. Откат коммита:
   ```bash
   git log --oneline -10            # последний «хороший» коммит
   git revert <bad-commit>
   cd server && npm ci --production && node src/index.js
   ```
3. Webhook безопасен при повторах: express.raw перед express.json() настроен, повторная обработка checkout.session.completed деактивирует старые подписки в транзакции.
4. Проверить дубли активных подписок:
   ```sql
   SELECT user_id, COUNT(*) FROM subscriptions WHERE is_active = 1 GROUP BY user_id HAVING COUNT(*) > 1;
   ```

### 2.2. Проблемы с БД (миграция сломала прод)

**Симптомы:** 500 на роутах, ER_BAD_FIELD_ERROR, migrate.js падает.

**Диагностика (5 мин):**
1. `node database/migrations/migrate.js` - какая миграция падает
2. `SELECT * FROM swiftmatch._migrations ORDER BY id DESC LIMIT 5;`

**Действия:**
1. Откатить деплой (см. 2.1), НЕ откатывать миграции вручную: большинство additive (новые колонки/таблицы), старый код их игнорирует.
2. Если миграция DROP/меняет данные (напр. 024 - DROP колонок): восстановить из бэкапа:
   ```powershell
   powershell -File scripts/verify-backup.ps1   # проверить последний бэкап
   # restore: mysql -uroot swiftmatch < backups/swiftmatch_YYYY-MM-DD.sql
   ```
3. Бэкап перед любой «тяжёлой» миграцией - обязателен.

### 2.3. Полный отказ (app / БД / nginx)

1. Restart: `pm2 restart swiftmatch` (или `docker compose restart app`).
2. Откат образа/кода до предыдущего тега.
3. MySQL упал (RADAR_PRE_LEAK_64 = нехватка RAM): перезапустить mysqld, проверить `SHOW PROCESSLIST`, уменьшить DB_POOL_MAX при нехватке памяти, добавить swap.
4. Если nginx отдаёт 502: проверить app healthcheck и CORS_ORIGIN (fail-fast при старте), перезапустить app.

## 3. Быстрая проверка после отката

- [ ] `/health` -> { status: ok, db: connected }
- [ ] Логин админа работает (dev-login 404 в production - ожидаемо)
- [ ] Один тестовый checkout (mock при NODE_ENV=production + без STRIPE_LIVE - недоступен; тестировать Stripe test-mode ключами)
- [ ] `SELECT COUNT(*) FROM subscriptions WHERE is_active = 1` - нет дублей
- [ ] Prometheus/Grafana отдают метрики

## N. Миграции БД: откат только через бэкап (этап 35)

- Down-миграций НЕТ: migrate.js применяет .sql только вперёд, записи в _migrations не удаляются.
- Откат схемы = восстановление из бэкапа (scripts/backup-mysql.ps1|sh), затем git checkout <prev-tag> + рестарт.
- Перед деплоем CI прогоняет scripts/schema-validate.mjs против живой БД — дрейф схемы ломает деплой ДО миграций, а не после.
- Все новые миграции обязаны быть идемпотентными (information_schema + PREPARE), чтобы повторный прогон после сбоя не ломал базу.

## N+1. RTO-замер восстановления из бэкапа (этап 44, аудит kimi 2.5)

Замерено 23.08.2026 через scripts/verify-backup.ps1 (restore в scratch-БД swiftmatch_verify + sanity-проверки):

| Метрика | Значение |
|---|---|
| Бэкап | swiftmatch_2026-08-18_075916.sql (0.3 MB, dev) |
| Полный цикл restore + sanity | **3.6 сек** |
| Sanity-проверки | user_profiles 130, matches 2, messages 213, subscriptions 1 |

**Экстраполяция на прод:** при росте БД до 1 GB ориентировочно ~10–15 мин (mysql restore ~1.5 MB/s + sanity). Целевой RTO для беты: **< 30 мин**. Пересчитывать раз в месяц перед релизом.

Проверка restore на чистой БД выполняется скриптом автоматически (weekly Task Scheduler через install-backup-task.bat).

## N+2. Rate-limit / lockout: решение по масштабированию (этап 44, аудит kimi 1.1)

**Решение: prod — strictly single-instance до миграции на Redis store.**

- express-rate-limit и lockout.js используют in-memory хранилище — лимиты НЕ шарятся между процессами
- Запрещено: pm2 cluster mode (pm2 start -i > 1), Docker replicas > 1, любой балансинг между инстансами API
- deploy.yml использует pm2 restart swiftmatch-api в fork mode (single) — совместимо
- При необходимости масштабирования ДО этого: перевести оба механизма на rate-limit-redis / Redis-backed lockout (REDIS_URL уже подключён, этап 29)
- Nginx-уровень (limit_req_zone api 30r/s, auth 5r/s в nginx/swiftmatch.conf) работает независимо от числа инстансов и остаётся первой линией защиты

## N+3. Circuit breaker для внешних сервисов (этап 76, аудит kimi #6 / дипсик #4)

**Задача:** не копить очередь запросов к внешним API (Stripe/OpenAI/S3) при их недоступности/деградации.

- Механизм: `server/src/circuit-breaker.js` (opossum), экспорты `createBreaker`, `stripeBreaker`, `wrapExternalCall`. Дефолты: timeout 10s, errorThresholdPercentage 50, resetTimeout 30s, volumeThreshold 5.
- **Stripe** — обёрнут `stripe-checkout` (premium.js:112, timeout 15s). При отказе checkout → осмысленная ошибка клиенту, без зависания.
- **OpenAI** (AI icebreakers, icebreakers.js) — модульный breaker `openai-icebreakers` (timeout 9s, volumeThreshold 3). При ошибке/таймауте/открытом breaker → DB-fallback (icebreaker_questions). Без `OPENAI_API_KEY` — сразу DB, без breaker.
- **S3** — N/A: проект не внедрил S3 (upload на локальный диск). При внедрении S3 обернуть загрузку breaker'ом по тому же паттерну.
- **Webhook'и (входящие)** — breaker неприменим (не исходящие вызовы); защита от повторов — идемпотентность/express.raw.

**Проверка:** серверный сьют 324/324 (+3 icebreakers-теста, мок circuit-breaker изолирует opossum), lint 0 errors.