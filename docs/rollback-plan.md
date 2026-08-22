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
