# SwiftMatch — Roadmap / журнал этапов

> Актуально: 29.08.2026.
> Полная детальная история и сводные аудиты живут в локальных (gitignored) файлах:
> `test/Что сделано.txt`, `test/Что доделать.txt`, `test/Оценка kimi|qwen|дипсик.txt`.
> Этот файл — чистая (UTF-8) сводка последних этапов, отслеживаемая в git.

## Этап 74 (29.08.2026) — E2E Premium (mock Stripe), Hangouts 2.0, B2B partner dashboard

- `e2e/premium.spec.ts` (7, P0): контракт tiers, mock checkout → активация 201, invalid tier 400, auth 401/403, cancel → null/404, рендер `/premium`.
- `e2e/hangouts2.spec.ts` (6, P0): Date/Company flows, mutual like, check-in, review — полный набор негативов (400/403/409).
- `e2e/partner-b2b.spec.ts` (3, P1): lifecycle B2B (register → offers → track → postback HMAC → dashboard → admin payout), 403 для обычного юзера, bad-signature 401.
- Итог: **server 321/321, front 81/81, E2E 150/150** (19 спеков), lint 0 errors, vite build OK.
- Коммит: `ead77b0`.

## Этап 75 (29.08.2026) — диагностика сохранения /admin/content + верификация backup/restore и RTO

- Жалоба «постоянно ломается сохранение /admin/content». Воспроизведено в браузере (Playwright):
  - чистый прямой заход → `PUT /api/admin/content/interests` **200**, 28 интересов, 0 console errors;
  - «грязная» сессия (login как обычный юзер → прямой заход в админку) → `AdminGuard` переписывает сессию админом, PUT **200**, 0 errors.
  - Вывод: в текущем состоянии сохранение работает. `admin-content.tsx` и `server/src/routes/admin/content.js` в этой сессии не менялись (только 3 E2E-спека, этап 74).
- Верификация backup/restore smoke + RTO (kimi 2.5): `node scripts/verify-backup.mjs` → **PASS**; CI-шаг "Backup restore smoke test" уже в deploy.yml; RTO в `docs/rollback-plan.md` N+1 (3.6 сек dev, <30 мин прод); scratch-DB подчищена.
- «Разбить AGENTS.md» — актуализировано: корневой AGENTS.md = 390 строк (ниже порога 1500), история вынесена в `docs/`.

## Этап 76 (29.08.2026) — circuit breaker для OpenAI (AI icebreakers) + DB-fallback

- Пункт аудита kimi #6 / дипсик #4 «Circuit breaker Stripe/OpenAI/S3»:
  - **Stripe** — уже обёрнут (`stripe-checkout` в `premium.js:112`, export `stripeBreaker` в `circuit-breaker.js`).
  - **S3** — N/A: проект не внедрил S3 (локальный диск), breaker применится при внедрении.
  - **OpenAI** — было открыто: `chat.completions.create` в `icebreakers.js` без fail-fast таймаута (запрос мог висеть при недоступном OpenAI).
- Реализовано (`server/src/routes/icebreakers.js`): OpenAI-генерация вынесена в модуль-уровневый breaker `openai-icebreakers` (opossum, timeout 9s, volumeThreshold 3). При ошибке/таймауте/открытом breaker → `.fire()` бросает → внешний catch → существующий DB-fallback. Без `OPENAI_API_KEY` поведение не изменилось.
- Тесты (`server/src/__tests__/icebreakers.test.js`, +3): (1) OpenAI успех → `source=openai` (обрезано до 3); (2) OpenAI падает → `source=db`; (3) пустой массив → fallback. Мок `circuit-breaker.js` изолирует opossum.
- Проверки: полноценный серверный сьют **324/324** (+3), lint 0 errors, icebreakers-spec зелёный.
- Счётчики: **server 324/324, front 81/81, E2E 150/150**, lint 0 errors.
- Коммит: `d290828`.

## Этап 77 (29.08.2026) — аудит связки Админка ↔ БД: инцидент «забаненный админ» + открытый баг PUT/POST 500

- **Инцидент (внёс сам при аудите):** мои ранние тесты `POST /api/admin/users/1/ban` (вернувшие 200) **забанили реального админа** `admin@mail.ru` (id=1, `is_active=0`). После бана активных админов не осталось → `dev-login` фолбэчил на не-админа (id=2, user) → ВСЕ админ-запросы давали **403** (роль не admin). Это объясняло «все GET 403» на живом сервере.
  - **Урок:** аудит `PUT /admin/users/:id/ban` с реальными id мутирует прод-БД. Диагностику бана — только на несуществующем id (`999999`) или в scratch-БД.
- **Восстановление:** `UPDATE users SET is_active=1 WHERE id IN (1,2)`. Админ id=1 снова активен, все GET-админ-роуты — 200.
- **Ложный «баг 500 на PUT/POST» — на деле тестовый артефакт PowerShell + curl.exe (бага кода НЕТ).**
  - Симптом: `PUT/POST` админ-роутов с непустым JSON — 500 "Internal server error"; `GET`-аналоги — 200; `{}` — 400. Устойчиво на живом.
  - **Диагностика (стек из перенаправленного stdout вторичного инстанса):** `SyntaxError: Expected property name or '}' in JSON at position 1` в `body-parser/json.js:92` — тело приходит в `express.json()` уже битым, ещё до роутера.
  - **Доказательство артефакта:** (1) полный автономный инстанс того же `index.js`-middleware даёт **200** через node `fetch`; (2) **на живом 3002 те же `PUT` через node `fetch` дают 200** (features → "Feature flags updated", content/interests → "interests updated", pricing → "Pricing saved"); (3) 500 появляется ТОЛЬКО когда тело шлётся `curl.exe` из PowerShell 5.1 — PS ломает embedded double-quotes в argv нативного exe (та же природа, что pitfall №47 «кириллица в API-тестах»: `Invoke-RestMethod`/инлайн-тело искажаются).
  - **Правило для API-тестов с телом:** слать тело файлом (`curl --data-binary @file.json`) или через node `fetch`/`Invoke-RestMethod -Body (bytes)`, НЕ инлайн-строкой с кавычками в PS.
  - Заключение: **открытый баг 500 отсутствует** — производственные PUT/POST (features, content, pricing) работают корректно.
- **Статус аудита (контракты админ-API здоровы):** все GET-админ-роуты — 200 и корректные структуры:
  - `users` → `{users:[...]}` (фронт `admin-reports` ждёт именно это) ✓
  - `features` → объект флагов (`admin-features`) ✓; `stats` → объект ✓
  - `analytics/{overview,retention,revenue-mix,registrations}`, `monetization/{pricing,revenue,ads,funnel}`, `experiments`, `partners`, `reports`, `campaigns`, `photos/pending`, `revenue-by-month` → **чистые массивы** (не `{data:[...]}`) — Recharts/DataTable не ломаются ✓
  - `GET /api/admin/content/interests` = 404 — **ожидаемо**, у `content.js` только `GET /content` (список секций) и `PUT /content/:section`; фронт зовёт PUT ✓
  - Пункты чек-листа «`/api/admin/analytics` 404 / `/api/admin/revenue` 404» — **не баги**: фронт не зовёт эти пути, использует `/analytics/overview` и `revenue-by-month`/`monetization/revenue`.
- **Деградация `mysql_schema.sql` (риск 🔴 при пересоздании БД):** schema.sql = **62 таблицы**, живая БД = **73**. Всё из 62 существует в live (лишних нет), но **29 таблиц созданы ТОЛЬКО миграциями 006–042** и отсутствуют в schema.sql: `_migrations`, `audit_log`, `config`, `consent_log`, `data_erase_requests`, `date_checkins`, `emergency_contacts`, `experiment_assignments`, `experiments`, `fcm_tokens`, `hangout_*` (5), `partner_*` (5), `partners`, `push_subscriptions`, `refresh_tokens`, `sms_verification`, `user_aliases`, `user_verifications`, `webhook_events`.
  - **Влияние на CI:** `deploy.yml` server-test/e2e инициализируют БД ТОЛЬКО `mysql < mysql_schema.sql` (строки 68/131), миграции в test-шагах НЕ прогоняются. `schema-validate.mjs` сверяет БД только против schema.sql (не читает `migrations/`) → самосверка «62 vs 62», дрейф миграционных таблиц НЕ ловится. `sql-explain-audit.mjs` — частично.

## Плановые хвосты (не блокируют)

- Внешние блокеры (не код): staging VPS + docker compose up, реальные ключи в `.env`, домен + SSL + Google Play, k6 100 VU на staging, UptimeRobot/Grafana-алерты.
- Код/низкий приоритет (после релиза): CSRF double-submit (при выносе API на поддомен), fingerprint refresh, SMS (Twilio), AI-модерация фото (Rekognition), CDN/S3.
- Открыт: сверка поведения jsdom/localStorage на Node 25 dev vs 22-alpine Docker.
