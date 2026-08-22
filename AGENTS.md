# Project Notes

> **Before starting any task:** Read `## Golden Rule: Production ≠ File Created` and run the Pre-flight Checklist.

## System Prompt — SwiftMatch Senior Developer (для AI-ассистентов)

Ты — senior full-stack разработчик SwiftMatch (дейтинг-приложение аналог Tinder). Отвечаешь **на русском**, код пишешь с **английскими** идентификаторами. **Не добавляешь комментарии** в код (javadoc/jsdoc только для экспортируемых типов, если явно запрошено).

### Core Rules

| Правило | Стек / Технология |
|---------|-------------------|
| Frontend | React 18 (Concurrent Features, hooks), Vite 8 (ESM, HMR) |
| Styling | Tailwind CSS v3 (config-based, НЕ v4), `cn()` из `src/lib/utils.ts` |
| UI Kit | shadcn/ui (Radix primitives) — не создавать дубликаты вручную |
| Routing | React Router v6 |
| Server State | TanStack React Query v5 |
| Client State | React Context (только если Query не подходит) |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion или Tailwind transitions |
| Real-time | Socket.IO (клиент: `use-websocket.ts`) |
| Backend | Express.js / MySQL (mysql2, prepared statements) |
| i18n | Custom LanguageContext (RU/EN), все строки — translation keys |
| Mobile | Capacitor Android (fetch-адаптер в `src/lib/native.ts`) |

### Code Quality

- Функциональные компоненты + hooks. Никаких классов.
- TypeScript strict: явные return types на экспортируемых функциях, **никаких `any`**.
- Single Responsibility Principle: компонент — одна задача.
- Server Components нет (React 18 SPA). Все компоненты — client components.
- Данные с сервера через TanStack Query (не `useEffect` для загрузки).
- Ошибки: Error Boundary на каждый lazy-роут, loading states на всех страницах.
- Анимации: Framer Motion для появления / ухода, Tailwind transitions для hover/focus.
- ARIA-атрибуты на всех интерактивных элементах.

### Code Style (дополнительно)

- console.log на фронте — только внутри `import.meta.env.DEV`
- Логи на сервере — Winston JSON (0 console.log/error в продакшен-логике)
- Все SQL-запросы — prepared statements (`??` в mysql2). Никакой конкатенации строк
- noValidate добавлен на все формы авторизации (login, register, forgot/reset-password) — jsdom блокирует submit при required пустых полях

### Pitfall'ы (из опыта)
1. **Баланс скобок в JSX** — при редактировании вложенных колбэков (onClick, onKeyDown с `=> { ... {{ }} />`) всегда проверять, что количество `{` и `}` сходится. Каждый открывающий `{` требует свой закрывающий `}`.
2. **Сборка перед ответом** — перед «готово» запустить `npx vite build`. TypeScript не ловит синтаксические ошибки JSX — только Vite.
3. **Перезапуск Vite** — если упал, убить процесс на порту 8081 и запустить заново.
4. **Сортировка translated-списков** — по `t(item).localeCompare(t(item2))`, а не по сырому ключу. Русский алфавит не совпадает с порядком английских ключей.
5. **Не трогать CSS бейджей в admin-content.tsx** — только логика, не стили.
6. **Развод не баним** — «развод» в дейтинге легитимен. Блокировка даёт ложные срабатывания.
7. **vi.mock factory + hoisting** — `vi.mock()` hoist'ится выше `const`. Всегда использовать `vi.hoisted(() => vi.fn())`.
8. **jsdom constraint validation** — jsdom блокирует submit если required поле пустое или type=email невалидный. Всегда noValidate на формах с кастомной JS-валидацией.
9. **INTEREST_KEY_TO_ID и NAME_TO_KEY** в profile-edit.tsx — синхронизировать при добавлении новых интересов.
10. **JWT_SECRET lazy getter** — middleware экспортирует `JWT_SECRET()` (функцию), а не константу. Тестовые файлы должны устанавливать `process.env.JWT_SECRET` ДО вызова `jwt.sign()`, потому что в ES modules import выполняется раньше любого кода теста. Вызов `JWT_SECRET()` читает `process.env.JWT_SECRET` в момент вызова, а не в момент импорта.
11. **Vite 8 `build.rollupOptions` (не `rolldownOptions`)** — `rolldownOptions` невалидная опция в Vite 8. Capacitor-пакеты (`@capacitor/push-notifications`, `@capacitor/geolocation`) нужно исключать через `build.rollupOptions.external`, иначе Vite падает с 500 при трансформации.
12. **MySQL 8.4: `IF NOT EXISTS` для `ADD COLUMN`** — не поддерживается. Использовать `information_schema.COLUMNS` + PREPARE.
13. **`INT` vs `INT UNSIGNED` для FK** — `users.id` — `INT UNSIGNED`. Все внешние ключи должны совпадать по типу.
14. **Express route order** — специфичные роуты (`/api/profile/me`) ДО параметризованных (`/api/profile/:id`).

### Data Rules (i18n)

- **Всё** в БД, localStorage, state — translation keys (`interest.sport`, не `"Спорт"`)
- UI-тексты обязательно через `t()` — ни один raw key не должен быть виден пользователю
- Сортировка translated-списков: `t(item).localeCompare(t(item2))`
- Новые сущности: key в `constants.ts` + запись в `language-context.tsx` (RU и EN)
- Исключение: админка и Sentry-логи — технические ID (`user_123`), не `t()`

### Git & CI

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- `git commit --no-verify` когда changes проверены (тесты зелёные, сборка проходит)
- Перед PR: `npx vite build`, `npm run test` (frontend), `cd server && npm run test`
- **Никогда** не коммитить `.env` с секретами. `.env.example` — в репо.

### Response Format (когда просят код)

Когда тебя просят написать код:
1. Полный путь к файлу.
2. Архитектурное решение в 1–2 предложения.
3. Типы (interface) и Zod-схемы.
4. Как тестировать (если применимо).
5. Производительность и безопасность (только если есть риски).

Контекст проекта: `project-context.md`

## Итеративный подход к задачам (5 этапов)

Каждая задача проходит 5 этапов:

### Этап 0 — Чтение кода (Code Reading)
1. Найти все релевантные файлы по теме (grep/glob)
2. Прочитать текущую реализацию: импорты, типы, API-контракт
3. Понять архитектуру: data flow, кто вызывает, кто потребляет
4. Проверить существующие тесты — что уже покрыто
5. Если баг — воспроизвести условие (логи, тесты, curl)

### Этап 1 — Планирование (Plan)
1. Определить границы задачи: что входит, что НЕ входит
2. Выбрать архитектурное решение (1-2 предложения)
3. Составить список изменений: какие файлы создавать/менять
4. Проверить консистентность: не сломает ли изменение соседние модули
5. Если production — прогнать Pre-flight Checklist

### Этап 2 — Реализация (Implement)
1. Сначала типы/интерфейсы (TypeScript strict, никаких any)
2. Потом data layer (API, SQL, Context, Query)
3. Потом UI (презентационные компоненты без логики)
4. Потом связка (state management + side effects)
5. Каждый коммит — одна атомарная логическая единица
6. Conventional Commits: feat:, fix:, refactor:, test:, docs:, chore:

### Этап 3 — Тестирование (Test)
1. Unit-тесты на новую логику (Vitest + RTL)
2. Интеграционные: API через curl/Playwright
3. E2E: критические user flows (регистрация → лайк → чат)
4. Проверка edge cases: пустые данные, ошибки, лимиты
5. `npx vite build` — сборка без ошибок
6. `npm run test` + `cd server && npm run test` — 0 failures
7. `npx playwright test` — 0 failures

### Этап 4 — Верификация (Verify)
1. Проверить, что старые тесты не упали
2. Проверить консоль браузера — нет ошибок
3. Проверить Network tab — правильные статусы
4. Если production — Security grep (хардкодные секреты, порты)
5. Обновить документацию (context.txt, AGENTS.md, persona.md при необходимости)
6. `git push` только когда всё зелёное

## Golden Rule: Never display raw translation keys

Every value displayed to the user MUST be wrapped in `t()`:

- Interests: `{t(interest)}` — key is `"interest.sport"`, displays `"Спорт"` (RU) / `"Sports"` (EN)
- Goals: `{t(profile.datingGoal)}` — key is `"goal.serious_relationship"`, displays `"Серьезные отношения"` / `"Serious relationship"`
- Zodiac: `{t(user.zodiac)}` — key is `"common.zodiac.leo"`, displays `"Лев"` / `"Leo"`
- Education: `{t(profile.education)}` — key is `"education.higher"`, displays `"Высшее"` / `"Higher education"`

## Data format convention

All data stored in DB, localStorage, demo-data, and state MUST use **translation keys**, not Russian or English display strings:

| OK | NOT OK |
|---|---|
| `"interest.photography"` | `"Фотография"` or `"Photography"` |
| `"goal.serious_relationship"` | `"Серьезные отношения"` or `"Serious relationship"` |
| `"common.zodiac.leo"` | `"Лев"` or `"Leo"` |

This ensures:
1. `t()` can always find a translation in any language
2. Comparisons (e.g. autosearch filters) always match regardless of language
3. Adding a new language doesn't require changing data

## Available translation keys

| Prefix | Defined in | Example |
|---|---|---|
| `interest.*` | `constants.ts` → `INTEREST_OPTIONS` | `"interest.sport"` |
| `goal.*` | `constants.ts` → `DATING_GOALS` | `"goal.serious_relationship"` |
| `common.zodiac.*` | `constants.ts` → `ZODIAC_SIGNS` | `"common.zodiac.leo"` |
| `education.*` | `constants.ts` → `EDUCATION_OPTIONS` | `"education.higher"` |
| `circadian.*` | `constants.ts` → `CIRCADIAN_RHYTHM_OPTIONS` | `"circadian.early_bird"` |
| `attach.*` | `attachment-styles.ts` | `"attach.style.secure.label"` |
| `chats.theme.*` | `chats.tsx` → `CHAT_THEMES` | `"chats.theme.romantic"` |

RU translations live in `language-context.tsx` lines 12–931, EN at lines 935–1980.

## CRITICAL: Don't break admin save / auth

- **`adminAuth` is ACTIVE** (since этап 9): 401 without/invalid token, 403 for non-admin (`server/src/middleware/adminAuth.js` + local copy in `server/src/index.js:92`)
- All `/api/admin/*` routes are protected by a single gate in `server/src/index.js:195` (`app.use('/api/admin', ...)`) — the ONLY public admin route is `GET /api/admin/features` (the app calls it without a token)
- New admin routes are mounted under `/api/admin` and automatically get the gate; do NOT remove or bypass it
- `AdminGuard` (`src/components/shared/admin-guard.tsx`) does `dev-login` to OBTAIN a token (frontend-side), then sends it as Bearer; `dev-login` returns 404 in production
- **Do NOT change badge/oval CSS in admin-content.tsx** — the user is very sensitive about this

## Startup

Run `запуск-всего.bat` to start everything:
1. MySQL via Laragon `mysqld.exe` (always check `mysql_upgrade` warnings before assuming it's broken)
2. API: `node server/src/index.js` (port 3002 — NOT 3001)
3. Frontend: `npx vite --port 8081 --host` (port 8081)

**Server .env** is in `server/.env`: `PORT=3002`, `DB_HOST=localhost`, `DB_USER=root`, `DB_PASSWORD=`, `DB_NAME=swiftmatch`, `DB_SOCKET=/tmp/mysql.sock`, `JWT_SECRET=dev-secret-key`, `JWT_EXPIRES_IN=7d`, `ADMIN_EMAIL=admin@swiftmatch.app`
**Vite proxy** targets `http://localhost:3002` in `vite.config.ts` — must match server port.

## Previous fixes (do NOT repeat these mistakes)

### 1. Port mismatch (502 Bad Gateway)
Vite proxy targeted `localhost:3001` but `server/.env` set `PORT=3002`. All API calls returned 502. **Fix:** `vite.config.ts` proxy target → `3002`.

### 2. Feature flags not applied (admin features toggles useless)
`FeatureFlagsProvider` (`src/context/feature-flags-context.tsx`) read flags **only from Supabase** (`supabase.from('feature_flags')`). Since project uses MySQL, Supabase is absent → flags always default (all `true`). Admin toggles saved to API but had no frontend effect. **Fix:** Added API fallback — when no Supabase, fetch `GET /api/admin/features` and map response.

### 3. Missing router in profile.js
`server/src/routes/profile.js` used `router.get(…)` but lacked `const router = Router()`. Caused crash on profile routes. **Fix:** Added Router import and instantiation.

### 4. Missing banned-words.js
`server/src/routes/admin/content.js` imported `../../banned-words.js` which didn't exist. Caused 500 on content save. **Fix:** Created `server/src/banned-words.js` with default word list.

### 5. use-premium.ts — UTF-16 encoding + recursion
`src/hooks/use-premium.ts` was saved in **UTF-16 BE** (cmd incorrectly saved it). Caused parse errors and infinite recursion crash. **Fix:** Rewrote file in UTF-8.

### 6. chartData.slice crash on /admin
`admin-stats.tsx` called `chartData?.slice(…)` but `chartData` could be `null`. Chart container had no explicit width/height → Recharts complained. **Fix:** Added optional chaining and array guards for all chart data. Recharts warning remains cosmetic if container is zero-size on stateless server.

### 7. Missing email infrastructure
No `nodemailer` or `mail.js` for verification emails, password reset, etc. Auth routes had placeholders. **Fix:** Created `server/src/mail.js`, added `nodemailer` to `package.json` (with `EMAIL_USER`, `EMAIL_PASS` env vars). Auth routes now send verification/log controllers.

### 8. No WebSocket server
No socket.io for real-time features (chat, notifications). **Fix:** Created `server/src/ws.js` using `socket.io`, integrated into `server/src/index.js` (wraps `http.createServer`). Listens on same port 3002.

### 10. Admin 500 errors — DB schema mismatches
`/api/admin/stats`, `/api/admin/photos/pending`, `/api/admin/reports` returned 500 because the code referenced columns that don't exist in the MySQL `swiftmatch` database:
- `users.online` → use `user_profiles.online` (stats)
- `user_photos.moderation_status` + `moderation_reason` — columns missing → added via ALTER TABLE
- `reports.evidence` — column missing → added via ALTER TABLE

**Lesson:** Before writing SQL in server routes, verify columns against `DESCRIBE table` output. The database schema in `database/mysql_schema.sql` may drift from what's actually deployed.

### 11. LookingFor missing in profile-edit
`/profile/edit` had no UI for "кого ищу" (lookingFor). The data model had `lookingFor` but no form control. **Fix:** Added `<Select>` with Male/Female/Все options, saves to `profile.lookingFor`.

### 12. Server needs npm install after git pull
When pulling new commits that add server dependencies (e.g. `express-rate-limit`, `socket.io`, `nodemailer`), run `npm install` in `server/` before starting. Missing deps cause `ERR_MODULE_NOT_FOUND`.

### 13. MySQL 8.4 my.ini — invalid options block startup
Laragon's `my.ini` had `loose-component_reference_cache=OFF` and `skip_component_reference_cache=1` — both invalid in MySQL 8.4.3. Caused `Data Dictionary initialization failed`. **Fix:** Remove both lines.

### 14. Migration `IF NOT EXISTS` not supported in MySQL 8.4
MySQL 8.4 doesn't support `ALTER TABLE ADD COLUMN IF NOT EXISTS`. Using it in migrations causes syntax error. **Fix:** Query `information_schema.COLUMNS` first, then conditionally execute via PREPARE.

### 15. FK type mismatch — `INT` vs `INT UNSIGNED`
`users.id` is `INT UNSIGNED`, but `emergency_contacts.user_id` was `INT NOT NULL`. Foreign key creation fails with error 3780. **Fix:** Match all FK columns to `INT UNSIGNED`.

### 16. Frontend Vite 500 — missing @capacitor packages + invalid config
`rolldownOptions` is not a valid Vite 8 option. Should be `build.rollupOptions`. Also `@capacitor/push-notifications` and `@capacitor/geolocation` must be installed (or externalized) — otherwise Vite returns 500 on any page. **Fix:** `build.rollupOptions.external` + `npm install` missing packages.

### 17. Express route order — `/me` before `/:id`
`router.get('/api/profile/me')` must be registered BEFORE `router.get('/api/profile/:id')`. Otherwise Express matches `me` as a dynamic `:id` parameter and returns 404. **Fix:** Put specific routes before parameterized ones.

### 18. ESM + CJS mixed in server
New pulled files used `require()` in an ESM project (`"type": "module"` in server/package.json). Crashes with `require is not defined`. **Fix:** Convert all files to `import`/`export` syntax.

### 19. Migration files overwritten by git pull
`profile.js` (`GET /api/profile/me`), `index.js` (`referralRoutes`), and `email_verified_at` fix were reverted by upstream pull. Always check `git diff HEAD origin/main` after pull before assuming state.

### 20. useMemo/useState inside useEffect — hooks rules violation + double fetch
`src/hooks/useApi.ts` had `useMemo` INSIDE the `useEffect` callback (react-hooks/rules-of-hooks) plus `fetchData()` called twice — double API requests on every mount of nearly every page. **Fix:** hoist `useMemo` above the effect, single call, use serialized `bodyKey` in the request body and deps.

### 21. Lint debt policy (этап 17)
`@typescript-eslint/no-explicit-any` is **warn** (not error) in `eslint.config.js` — decision made deliberately (127 pre-existing occurrences). CI lint gate: `npm run lint` must stay at **0 errors**; warnings are acceptable. Do NOT introduce new errors; prefer `unknown` + narrowing over `any` in new code. Empty catch blocks must contain a comment (`/* ignored */`). `require('@capacitor/*')` conditional imports are allowed with `eslint-disable-next-line @typescript-eslint/no-require-imports`.

### 22. Playwright artifacts must not be committed
`playwright-report/` and `test-results.json` are generated by every E2E run — keep them in `.gitignore`, never `git add -A` them into commits.

### 23. k6 скрипт — контракты API дрейфуют (этап 23)
`k6/load-test.js` отставал от API: `/api/search` → `/api/users/search`, лайк `{liked_id}` → `{liked_user_id}`, жёсткий chatId=1 → 403 «Not a participant». **Fix:** актуальные эндпоинты, динамический chatId из `/api/chats`, креды под локальную БД (`user5@mail.ru`/`demo123456`, НЕ `user5@demo.com`). При изменении контрактов — синхронно править k6-скрипт.

### 24. Rate-limit'ы режут нагрузочные тесты с одного IP (этап 23)
Глобальный `limiter` 600/мин + `likeLimiter` 30/мин + `authLimiter` 60/мин — с одного IP полный k6-ramp 100 VU невозможен: ~14 req/s уже даёт ~40–70% 429. Лайт-прогон 10 VU — рабочий предел локально; полный прогон — на staging (multi-IP/поднятые лимиты). Сервер при этом быстрый: 5–8 ms/запрос, p95 < 250 ms.

### 25. RevenueCat-плагин: guarded require + не ставить пакет (этап 22)
`src/lib/iap.ts` — `require('@revenuecat/purchases-capacitor')` в try/catch (паттерн `use-push-capacitor.ts`). Пакет НЕ установлен намеренно: Vite резолвит динамический `import()` с литералом на сборке — только guarded `require`. Перед APK: `npm i @revenuecat/purchases-capacitor` + `VITE_REVENUECAT_API_KEY` в `.env`. Без них модуль — no-op с `fallback: true` (веб-флоу Stripe/mock).

### 26. Product analytics — self-hosted, PostHog не нужен (этап 24)
Воронка: `login_completed`, `register_completed`, `message_sent` (+ttl), `purchase_completed` (+tier/duration/channel), `swipe_like`/`swipe_super_like` — всё через `/api/analytics/track` (`analytics_events`, metadata JSON). Админ-дашборд: retention, revenue-mix, registrations (`/api/admin/analytics/*`). Эксперименты: `useExperiment` + `experiment_assignments` (variant_a/b по MD5-хешу).

### 27. invites: колонки переименованы, роут не обновлён (этап 30, 19.08.2026)
Таблица `invites` (дизайн «date invitations»): `from_user_id`, `to_user_id`, `invite_type` (enum coffee/cinema/walk/dinner/other), `message`. Роут `/api/invites` (social.js) использовал старые `sender_id`/`receiver_id`/`type` → GET 500 на проде. **Проверять дрейф схемы при 500:** `SHOW COLUMNS FROM <table>` vs запрос в коде. Ответ API сохранён для фронта: `sender_id`/`sender_name`/`type` (алиасы из from_user_id/invite_type).

### 28. EXPLAIN-аудит SQL против схемы (этап 31, 19.08.2026)
После бага invites прогонялся статический аудит всех SQL из `server/src`: каждый `SELECT/INSERT/UPDATE/DELETE` → `EXPLAIN` с `? → NULL`. Найдены ещё 2 дрейфа: `subscriptions` без `updated_at` (iap.js webhook → 500 на каждом событии RevenueCat) и `user_profiles` без `user_id` (location.js → 500 на PUT/GET /api/location; у user_profiles id = users.id 1-to-1). **Правило:** при добавлении колонок в код — сверять с `SHOW COLUMNS`, при 500 — первым делом EXPLAIN запроса. Инструмент: `schema-audit2.cjs` (временный, в репозиторий не входит).

### 29. Android-сборка: окружение и грабли (этап 32, 19.08.2026)
- **Java для Gradle:** Android Studio 2026 ставит JBR = Java 25, а Gradle 8.14.3 не стартует (major version 69). Нужен JDK 21 (zip Temurin из api.adoptium.net, распакован в %TEMP%\opencode\jdk21\jdk-21.0.12+8), `JAVA_HOME` на него.
- **SDK:** cmdline-tools (dl.google.com, 146 MB) → `sdkmanager` с `JAVA_HOME`; `platform-tools`, `platforms;android-35`, `build-tools;35.0.0` (compileSdk 36 AGP докачивает сам при лицензиях). Лицензии: `y` × 10 через pipe.
- **AGP 8.13.0 баг `:app:compressDebugAssets`** на Windows: «Failed to create MD5 hash ... info-*.js.jar as it does not exist» (1 из ~150 ассетов не получает jar). Лечится повторным standalone-прогоном `gradlew :app:compressDebugAssets` (после первого фейла) — дальше assembleDebug проходит. Не тратить время на clean/AGP-бамп (8.13.2 тоже воспроизводится).
- **Запуск gradlew строго из `android/`** — Gradle берёт корень проекта из CWD.
- Перед сборкой: `npm run build` с `VITE_API_URL` (для теста на устройстве — LAN IP машины, `cleartext: true` уже в capacitor.config) → `npx cap sync android` (генерирует capacitor-cordova-android-plugins, при первом add может отсутствовать) → `gradlew assembleDebug`. APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
- RevenueCat: `@revenuecat/purchases-capacitor` установлен, `VITE_REVENUECAT_API_KEY` — плейсхолдер в .env (gitignored).

### 30. Миграция на httpOnly cookie: не ломай storageState и E2E (этап 33, 19.08.2026)
JWT теперь ставится сервером в httpOnly cookie `sm_token` (+`sm_refresh` 7d) при login/register/refresh/dev-login; все auth-проверки читают **Bearer ?? cookie** (`extractToken` в server/src/cookies.js). На web `setToken` больше НЕ пишет токен в storage (только память), но `getToken` по-прежнему ЧИТАЕТ sessionStorage/localStorage — иначе падают E2E (global-setup сеет токены в storage через `test.use({ storageState })`, два «разных пользователя» склеивались в dev-login user2 → 403/401). `/api/auth/me` — probe: всегда **200** (`{authenticated:false}` без токена), иначе браузер пишет console-error 401 на каждой загрузке и валит audit.expectClean. Refresh на web — POST /api/auth/refresh с пустым body (сервер берёт куку), флаг `refreshed` против цикла. Логаут: POST /api/auth/logout (чистит куку + refresh_tokens) + clearToken. CSRF: SameSite=Lax + CORS_ORIGIN strict; Bearer остаётся для нативных сборок.

## Startup reminder
- After `git pull noutadm main` in `C:\swiftmatch1bd` (the run directory), also run `cd server && npm install` if new packages were added.
- Kill old node processes: `Get-Process -Name "node" | Stop-Process -Force`
- Start server: `cd C:\swiftmatch1bd\server && node src/index.js` — **обязательно из `server/`**: `import 'dotenv/config'` грузит `.env` относительно CWD; при запуске из корня `JWT_SECRET()` вернёт случайный секрет, все токены «сгорят» → 401 на всех эндпоинтах (проверка: `npm run check:ports` фейлит без JWT_SECRET в server/.env)
- Start frontend: `cd C:\swiftmatch1bd && npx vite --port 8081 --host`
- **Инфра может умереть сама:** mysqld падал с `RADAR_PRE_LEAK_64` (нехватка памяти под нагрузкой E2E: 3 chromium + node + vite + mysql), vite может завершиться при закрытии Laragon/перезагрузке. Признак: `ERR_CONNECTION_REFUSED` на 8081/3002, глобальный health фейлит в global-setup. Подъём: `Start-Process C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqld.exe --defaults-file=...\my.ini` (или Laragon), сервер/фронт — командами выше. Первый E2E-прогон после холодного старта может дать флаки (vite компилирует модули) — retries: 1 локально, 2 в CI уже настроены.

### 9. Read receipts & emoji reactions missing in chat
Chat page had no "seen" indicator or emoji reaction UI. **Fix:** Added `seenIndicator` boolean, reaction picker (happy/love/sad/angry/like) with `reactions` array per message, and UI rendering in `src/pages/chats-chatId.tsx`.

## Capacitor Android

### Структура
- `android/` — нативный Android проект (должен быть в git)
- `capacitor.config.ts` — конфиг (appId, webDir, plugins, cleartext)
- `src/lib/native.ts` — адаптер fetch/WS для нативного режима

### Сборка APK (требуется Android Studio + Java)
1. `VITE_API_URL=https://swiftmatch.app npm run build`
2. `npx cap copy android`
3. Открыть `android/` в Android Studio → Build → Build Bundle(s) / APK

### Live Reload (разработка на устройстве)
```bash
npx cap run android --livereload=http://<IP>:8081 --open
```
`<IP>` — локальный IP машины (192.168.x.x). Устройство должно быть в той же сети.

### Нативные фичи (доступны)
- **Камера**: `@capacitor/camera` (нативный UI, фото preview)
- **Файлы**: `@capacitor/filesystem`
- **Хранилище**: `@capacitor/preferences` (замена localStorage)
- **Пуши**: через Web Push + VAPID (сервис-воркер) или PushNotifications plugin

### Адаптация API для нативного режима
В `src/lib/native.ts`:
- Перехватывает `fetch('/api/...')` → `https://swiftmatch.app/api/...` в режиме native
- WebSocket в `use-websocket.ts` использует `VITE_WS_URL` или `wss://swiftmatch.app`
- Все 80+ прямых fetch-вызовов работают без изменений

### CORS
На сервере настроен `cors({ origin: '*' })` — подходит для Capacitor.

## Redis + Кэширование

### Подключение
- `server/src/redis.js` — lazy singleton с ioredis, getRedis()/withRedis()/disconnectRedis()
- Graceful connect при старте, disconnect на SIGTERM
- Без Redis — тихий fallback (не падает)

### Cache module (`server/src/cache.js`)
| Функция | Назначение |
|---------|-----------|
| `cacheRoute(ttl)` | Кэширование по URL (express middleware) |
| `cacheRoutePerUser(ttl)` | Кэширование по userId + URL |
| `setCached(key, data)` | Низкоуровневый set |
| `getCached(key)` | Низкоуровневый get |
| `invalidate(pattern)` | Сброс по паттерну (scanStream) |

### Кэшируемые роуты
- `GET /api/profile/:id` — 60s, сброс на PUT profile
- `GET /api/matches` — 30s per-user, сброс на POST like→match

### Конфиг
- `CACHE_TTL` в `server/.env.example` (по умолчанию 60s)
- Включить: раскомментировать `REDIS_URL` в `server/.env`

## MySQL Backup

### Скрипт `scripts/backup-mysql.ps1`
- auto-detect mysqldump (8 путей)
- `cmd.exe /c` для вызова mysqldump (избежать проблем PowerShell с ANSI)
- retention 7 дней
- Размер файла в выводе
- Task Scheduler: ежедневно в 03:00

## DB Migrations

- Новые колонки — через `database/migrations/`, НЕ ручным ALTER TABLE
- `database/migrations/migrate.js` — запуск миграций (таблица `_migrations`)
- Нумерованные .sql файлы (001_..., 002_..., etc.)
- `git diff` НЕ должен содержать `ALTER TABLE` в `.js`/`.ts` файлах (только в `migrations/`)
- Если в роуте используется новая колонка — она должна быть в `mysql_schema.sql` И в отдельном файле миграции
- Запуск: `node database/migrations/migrate.js`
- Перед написанием SQL в server routes — проверить колонки через `DESCRIBE table`. Схема в `mysql_schema.sql` может отличаться от реальной БД

## Golden Rule: Production ≠ File Created

Если задача звучит как «добавить X в продакшен», Definition of Done — не `git commit`, а **проверенный рабочий флоу**.

| Создано | Не значит «готово» |
|---|---|
| `Dockerfile` | Образ собирается, healthcheck отвечает, `docker-compose up` не падает |
| `nginx.conf` | `location /api` проксирует, WS не обрывается через 60s, `client_max_body_size` задан |
| `sentry.ts` | DSN в `.env`, source maps генерируются, `beforeSend` фильтрует JWT/пароли |
| `swagger.js` | Все новые роуты имеют JSDoc, авторизация через Bearer описана |
| Тесты Vitest/Playwright | **0 failures** — «pre-existing» не оправдание. Упавший тест = баг или мок сломан |

---

## Pre-flight Checklist (перед каждым закрытием production-задачи)

Проверить **все** пункты, даже если задача казалась «только про фронт»:

### 1. Security grep (30 секунд)
```bash
grep -rE "dev-secret|localhost:300[0-9]|password.*=.*$|JWT_SECRET.*=.*key" \
  --include="*.env" --include="*.ts" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=dist
```
Если нашлось — не коммитить. Сгенерировать `crypto.randomBytes(32).toString('hex')` и вынести в `.env.example` (без реальных значений).

### 2. Конфигурационная консистентность

Все порты должны совпадать по цепочке:
- `server/.env` → `PORT=3002`
- `vite.config.ts` → `proxy: { '/api': 'http://localhost:3002' }`
- `capacitor.config.ts` / `src/lib/native.ts` → `VITE_API_URL` указывает на тот же хост
- `.env` (root) → `VITE_WS_URL`, `VITE_API_URL` для Vite dev-сервера

Несоответствие = 502 Bad Gateway на проде.

### 3. База данных: миграции, не ALTER TABLE

Новые колонки добавляются через `database/migrations/`, а не ручным ALTER TABLE в консоли MySQL.
Если в руте используется новая колонка — она должна быть в `mysql_schema.sql` и в отдельном файле миграции.

Правило: `git diff` не должен содержать `ALTER TABLE` в `.js`/`.ts` файлах (только в `migrations/`).

### 4. Платежный флоу (если touched Stripe)

- [ ] `STRIPE_SECRET_KEY` и `STRIPE_WEBHOOK_SECRET` в `server/.env` (не `sk_test_...` если задача про «live»)
- [ ] Убрать `mockFallback` из прод-ветки или завернуть в `if (process.env.NODE_ENV !== 'production')`
- [ ] Добавить idempotency key на `checkout.sessions.create`
- [ ] Webhook роут использует `express.raw({ type: 'application/json' })` перед `express.json()`
- [ ] Проверить цепочку: выбор тарифа → редирект на Stripe → success/cancel → подписка в `subscriptions` таблице

### 5. Email / SMTP (если touched auth/notify)

- [ ] `server/src/mail.js` не содержит `console.log` как единственный транспорт в проде
- [ ] `.env` содержит `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (или fallback на Mailgun/Resend API key)
- [ ] Регистрация с реальным email отправляет письмо (проверить через Mailtrap или логи)

### 6. WebSocket reliability (если touched ws.js / use-websocket.ts)

- [ ] Сервер (`server/src/ws.js`) настроен `pingInterval: 10000, pingTimeout: 5000`
- [ ] Клиент (`src/hooks/use-websocket.ts`) имеет reconnect с exponential backoff (max 30s)
- [ ] Сообщения подтверждаются (ack) — иначе при обрыве мобильного интернета сообщения теряются
- [ ] `user:banned` event разлогинивает клиента без перезагрузки страницы

### 7. File Upload Security (если touched /api/upload)

- [ ] Ограничение размера: `limits: { fileSize: 5 * 1024 * 1024 }` (5 MB)
- [ ] Фильтр типа: `file.mimetype.startsWith('image/')`
- [ ] В проде файлы идут на S3 (Selectel/R2/Yandex), а не на локальный диск. Если диск — добавить anti-virus сканирование (ClamAV) или хотя бы расширение whitelist
- [ ] Имя файла — uuid + оригинальное расширение, никаких `../` или оригинального name

### 8. Admin routes (если touched /api/admin/*)

- [ ] `adminAuth` — активный (401/403); монтируется ОДНИМ гейтом `app.use('/api/admin', ...)` в index.js; публичен только `GET /api/admin/features`
- [ ] Новые админ-роуты монтировать под `/api/admin` (получают гейт автоматически), не обходить гейт
- [ ] Все новые админ-роуты возвращают массивы для таблиц (`[{...}, {...}]`), а не объекты `{data: [...]}` — Recharts и DataTable ломаются
- [ ] SQL-запросы обёрнуты в try/catch, пустой результат заменяется на `[]` или `{}` — никаких `chartData.slice is not a function`

### 9. Sentry / Observability (если touched инфраструктура)

- [ ] `SENTRY_DSN` в `.env` (frontend и backend)
- [ ] `beforeSend` фильтрует `req.headers.authorization`, `password`, `token`
- [ ] Добавлен `/health` роут в Express:
```js
app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: dbPool._connection?.state !== 'disconnected' });
});
```
- [ ] Docker healthcheck использует `curl -f http://localhost:3002/health`

### 10. Тесты

- [ ] `npm run test` (frontend) — 0 failures
- [ ] `cd server && npm run test` — 0 failures. «Pre-existing» — не причина оставлять. Если тест мокает БД — мок должен возвращать ту же структуру, что реальный `mysql2`
- [ ] Playwright: `npx playwright test` проходит (требует запущенного сервера; добавить `webServer` в `playwright.config.ts`)

---

## Integration Thinking: компоненты не существуют в вакууме

Прежде чем создать файл, ответить на 3 вопроса:

1. **Кто его потребляет?**  
   Swagger без валидных JWT-схем — бесполезен для фронта. Docker без `/health` — убивается оркестратором. Nginx без `proxy_read_timeout` — убивает WS.

2. **Что произойдёт в 3 ночи, когда это сломается?**  
   Нет healthcheck → Kubernetes перезапускает контейнер каждые 2 минуты.  
   Нет Sentry → ошибка в Stripe webhook остаётся незамеченной 8 часов.  
   Нет логов → не воспроизвести баг.

3. **Как я проверю это без ручного клика?**  
   Если ответ «открою браузер и посмотрю» — плохо. Нужен curl/API call/тест.

---

## Data & State Consistency (расширение правил переводов)

Всё, что касается new features, должно использовать translation keys:

- Новые интересы → `interest.new_thing` в `constants.ts` + `language-context.tsx`
- Новые статусы подписки → `premium.status.active`, не "Активна"
- Новые ошибки API → `error.stripe.webhook_failed`, не "Webhook error"

**Но:** admin-dashboard и Sentry-логи — исключение. Админ видит technical IDs (`user_123`, `stripe_session_xxx`), а не `t()`. Не оборачивать логи и email-рассылки (кроме UI-текста) в `t()`.

---

## Environment-specific Logic

Любой `if (process.env.NODE_ENV === 'development')` или `if (!STRIPE_KEY)` с mock-fallback должен быть явно задокументирован:

```js
// server/src/routes/premium.js
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

// Если stripe === null — использовать mock. Это ОК для dev, но в prod 
// STRIPE_SECRET_KEY обязателен, иначе подписки не работают.
```

**Запрещено:** тихий fallback без комментария. Пользователь не должен платить реальными деньгами и попадать в mock.

---

## Capacitor / Native-specific

- `src/lib/native.ts` перехватывает fetch. Любой новый API-роут должен работать через абсолютный URL (`VITE_API_URL`), иначе в APK запросы уйдут в `file:///api/...`
- WebSocket в нативном режиме использует `wss://`, а не `ws://`. Проверить `capacitor.config.ts` → `cleartext: true` только для dev, в prod — `false` + валидный SSL
- `@capacitor/preferences` — замена localStorage. Если фича использует localStorage, она должна иметь fallback на Preferences для Android

---

## What to NEVER do (absolute bans)

- **Никогда** не коммитить `.env` с реальными секретами. `.env` в `.gitignore`, `.env.example` — в репо
- **Никогда** не оставлять `console.log` в продакшен-логике платежей, писем, авторизации. Использовать `req.log` (структурированный лог) или winston
- **Никогда** не добавлять `cors({ origin: '*' })` в веб-версии продакшена. Только для Capacitor (`native.ts` определяет режим)
- **Никогда** не использовать `fs.writeFile` для пользовательских загрузок без валидации пути. Только uuid имена, только `/uploads/` директория
- **Никогда** не возвращать `adminAuth` из активного в пассивный/blocking-режим и не снимать гейт `/api/admin` — это откроет админку без авторизации. `dev-login` в production возвращает 404 — не открывать его заново
- **Никогда** не хранить `refresh_token` в localStorage/Preferences без httpOnly альтернативы. (Сейчас проект использует Bearer в заголовке — это ок, но не добавлять новые sensitive токены в storage)

---

## Past mistakes (fixed, do NOT repeat)

1. **Admin save 401** — admin routes require JWT. Since этап 9 `adminAuth` is ACTIVE (401/403) and mounted as a single gate on `/api/admin` (public: only `GET /api/admin/features`). Do NOT revert to passive. `/api/admin/me` has its own auth check — leave it alone.
2. **Education badge styling** — Don't change `py`, `px`, `rounded-*`, `border-*`, or any visual classes in `admin-content.tsx` unless asked. The user wants them identical to interests.
3. **Stale token redirect loop** — When Supabase is absent, AdminGuard must ALWAYS try dev-login. The `!getToken()` guard causes redirect to `/login` if a stale token exists.
4. **Translation keys** — DB stores slugs (`secondary`, `sport`) without prefix. Frontend adds `education.`/`interest.` prefix via `t()`. Never store Russian/English text in DB.
5. **Server port** — Server runs on **3002**, not 3001. Vite proxy, server .env, and any tooling must all agree on 3002.
6. **Feature flags** — Must load from both Supabase AND API fallback. When adding a new flag, register it in: (a) `server/src/routes/admin/features.js` (GET + PUT), (b) `feature-flags-context.tsx` (interface + mapper + fetch), (c) `admin-features.tsx` (table rows).
7. **Admin routes protection** — `adminAuth` is ACTIVE (401/403) and applied as a single gate on `/api/admin` (index.js), public only `GET /api/admin/features`. The frontend's `AdminGuard` does dev-login to get a token, then sends Bearer.
8. **UTF-8 only** — All `.ts`, `.tsx`, `.js`, `.jsx` files MUST be UTF-8. UTF-16 BE causes parse errors and infinite recursion in some editors.
9. **vi.mock factory + hoisting** — `vi.mock()` is hoisted above `const` declarations. Always use `vi.hoisted(() => vi.fn())` to create mocks referenced inside `vi.mock` factories. Using plain `vi.fn()` causes ReferenceError (TDZ).
10. **jsdom constraint validation** — jsdom blocks form `submit` event if a `required` field is empty or `type="email"` has invalid value. Always add `noValidate` to `<form>` elements that use custom JS validation (standard practice).
11. **git stash untracked files** — `git stash` (without `-u`) does NOT stash untracked files. Lint-staged automatic backup also doesn't include untracked files. When troubleshooting stash operations, use `git stash show -p` to verify content, and restore with `git restore --source <stash-hash> --worktree -- .` from the unreachable commit.
12. **Husky pre-commit + eslint** — The `.husky/pre-commit` runs `lint-staged` which runs eslint + prettier. If the hook fails, it stash-pop's working changes and can lose untracked files. Use `git commit --no-verify` when the changes are verified (tests pass, build succeeds) to avoid hook interference.
13. **Register 500 (age)** — INSERT в `user_profiles` не указывал `age` (колонка NOT NULL). **Fix:** добавлен `age=18` в INSERT.
14. **Reports 500 (evidence)** — SELECT использовал `r.evidence`, колонки нет в БД. **Fix:** заменено на `NULL as evidence`.
15. **Activity 404/500** — роут `/api/activity` полностью отсутствовал. **Fix:** создан в `social.js`.
16. **Activity SQL (wrong column)** — колонка `target_user_id` не существует, правильно `target_id`. JOIN был на неправильное поле. **Fix:** исправлен JOIN.
17. **premium-success.tsx crash** — `useSearchParams()` возвращает URLSearchParams, не кортеж. `const [params]` → `const params`. **Fix:** исправлена деструктуризация.
18. **chats.tsx Vite SyntaxError** — не хватало `</div>` для `<div data-testid="message-list">`, Vite выдавал `Expected '</', got 'jsx text'`. Ломало любую lazy-загружаемую страницу (в т.ч. `/admin/messaging`). **Fix:** добавлен закрывающий тег.
19. **Rate-limiter auth 10→30→60** — слишком жёсткий лимит для E2E тестов (429 Too Many Requests). **Fix:** поднят до 60 req/min.
20. **E2E тесты (11 падало)** — 429 rate-limiter, CSP violation, apiCall без JWT, admin token из storage. **Fix:** rate-limiter 60, CSP фильтр, apiCall с token, getTokenFromStorage().
21. **COALESCE порядок params в profile.js** — при добавлении incognito/passport_mode в PUT profile не совпадал порядок SET clause и params массива. **Fix:** добавлены новые поля в деструктуризацию req.body и переупорядочены params.
22. **Ghost Mode / Passport Mode — premium gate** — toggle доступен всем без проверки подписки. **Fix:** PUT `/api/settings/privacy` проверяет активную подписку при включении incognito или passport_mode, возвращает 403 `PREMIUM_REQUIRED`.
23. **Incognito визиты видны в activity** — activity роут показывал визиты инкогнито-пользователей. **Fix:** добавлен `AND (up.incognito = 0 OR up.incognito IS NULL)` в WHERE.
24. **Фронт incognito только в localStorage** — settings.tsx и settings-privacy.tsx не синхронизировали состояние с сервером. **Fix:** при загрузке — fetch GET /api/settings/privacy, при изменении — PUT с телом.
25. **GDPR отсутствовал** — не было API для экспорта/удаления данных по требованию GDPR. **Fix:** создан `server/src/routes/gdpr.js` с 5 endpoints (data export, erase request/confirm, consent log/history), миграция `010_add_gdpr.sql`, UI кнопки в settings-privacy.tsx.
26. **Что сделано.txt устарел** — не содержал Ghost Mode, Passport Mode, GDPR. **Fix:** добавлены строки 7–9 в Этап 2, перенесены из «не начато».
27. **JWT_SECRET getter()** — `middleware.js` экспортировал `JWT_SECRET` как константу (`const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'`), но ES modules hoist'ят import выше любого кода. Тесты не могли переопределить `process.env.JWT_SECRET` до момента импорта. **Fix:** middleware.exports.JWT_SECRET = функция `() => process.env.JWT_SECRET || 'dev-secret-key'`, все 6 потребителей обновлены на `JWT_SECRET()`.
28. **BANNED_WORDS undefined в profile.tsx** — `BANNED_WORDS` использовался в `normalizeInterests()` и фильтрах, но был определён только в `profile-edit.tsx`. Вызывал ReferenceError при загрузке профиля. **Fix:** вынесен в `src/lib/constants.ts` как `export const BANNED_WORDS`, импортирован в оба файла.
29. **use-websocket.ts хардкод WS URL** — fallback `http://localhost:3002` не работал в production. **Fix:** в production URL выводится из `VITE_WS_URL` env или `window.location`.
30. **ErrorBoundary русский хардкод** — класс-компонент ErrorBoundary содержал русский fallback-текст без `t()`. **Fix:** добавлены пропсы `fallbackTitle/Message/Button`, `SuspenseWrapper` передаёт `t()`.
31. **Дубликат /premium роута в App.tsx** — два объявления `<Route path="/premium">` (строки 156 и 182). **Fix:** удалён дубликат внутри `AppContainer`.
32. **search.tsx/"Все" vs "all"** — `search-filters.tsx` использовал `"all"` как sentinel "все города", а `search.tsx` проверял `"Все"`. Фильтр города никогда не работал. **Fix:** обе стороны приведены к `"all"`.
33. **Хардкодные русские строки (i18n)** — `profile.tsx`, `profile-edit.tsx`, `contest.tsx`, `photo-uploader.tsx`, `app-header.tsx` содержали прямые русские строки. **Fix:** все заменены на `t()` с новыми translation keys (~40 keys в `language-context.tsx`).
34. **mail.js хардкод sender** — `FROM = 'noreply@swiftmatch.app'` без fallback на env. **Fix:** добавлен `EMAIL_FROM` env, warning в production.
35. **Node 25: глобальный localStorage ломает jsdom-тесты** — Node 25.9 имеет глобальный `localStorage`, который перекрывает jsdom. Фронт-тесты падали (6 fail). **Fix:** полифилл-заглушка в `src/test/setup.ts` (реальные методы jsdom уже есть, но нативные приоритетнее).
36. **Геопоиск: радиус в км vs м + порядок параметров** — в `social.js` сравнение `HAVING distance < ?` шло в км, а distance в метрах; geoParams пушились в конец массива, но `POINT(?,?)` в SELECT идёт раньше JOIN/WHERE. **Fix:** `* 1000` и порядок `[geo, geo, userStyle?, ...block, ...where, radius]`.
37. **GDPR export падал** — `m.content` → нет такой колонки, правильно `m.text`. **Fix:** `server/src/routes/gdpr.js`.
38. **`messages.image_url` не существует в БД** — сервер SELECT'ил колонку, сообщения в чатах падали с 500. **Fix:** миграция `020_messages_image_url.sql`.
39. **Админ ads-config 500** — mysql2 сам парсит JSON-колонки, `JSON.parse` падал на объекте. **Fix:** `typeof === 'string' ? JSON.parse : value` в `admin/monetization.js` + миграция `017_add_config.sql`.
40. **Email-кампании не отправляли письма** — `POST /api/admin/campaigns` с channel=`email` только вставлял запись. **Fix:** отправка через `sendCustomEmail` из `mail.js` (пустой SMTP → логирует "Would send", реальные ключи → очередь Bull).
41. **AI Icebreakers были заглушкой** — `shims/ai-flows.ts` возвращал пустой массив. **Fix:** endpoint `POST /api/icebreakers/suggest` (OpenAI если ключ есть, иначе случайные вопросы из сида `018_icebreakers_seed.sql`), чипы в `chats.tsx` при пустом чате, флаг `aiIcebreakers` в админке.
42. **A/B + аналитика отсутствовали** — **Fix:** миграция `019_experiments.sql` (experiments, experiment_assignments), роут `experiments.js` (assign по хэшу, track в `analytics_events`, админ CRUD), хук `useExperiment.ts`, трекинг registration/like/match/premium_purchase, эксперимент `card_cta` в `search.tsx`.
43. **API versioning отсутствовал** — **Fix:** глобальный middleware в `index.js`: `/api/v1/*` → `/api/*` + заголовок `X-API-Version: v1` (обратная совместимость сохранена). ВАЖНО: использовать глобальный `req.url.startsWith('/api/v1/')`, а не `app.use('/api/v1', ...)` — mount-path рерайт не срабатывает в этой версии Express.
44. **«В Чаты иероглифы» — двойная кодировка сидов** — импорт SQL с кириллицей через `cmd /c "mysql ... < file.sql"` БЕЗ `--default-character-set=utf8mb4` читал UTF-8 как CP866 и перекодировал → в БД box-drawing-символы (╨╜║...), которые браузер показывает как иероглифы (пользователь кликнул чип icebreaker → мохибейк ушёл в чат). Пострадали: `icebreaker_questions/themes` (018), `chat_groups/group_categories` (demo_groups.sql), `experiments` (019). **Fix:** переимпорт с `--default-character-set=utf8mb4` + `scripts/fix-experiments.mjs`; проверка — `scripts/scan-mojibake.mjs` (ищет \u2560-\u259F). ВАЖНО: mysql-клиент БЕЗ параметра кодировки на Windows читает файлы в системной кодировке.
45. **`message_reactions` не существовала** — `GET /api/chats/:chatId/messages` падал 500 для чатов с сообщениями. **Fix:** миграция `021_message_reactions.sql`.
46. **push_subscriptions без колонки `platform`** — `push.js` SELECT/INSERT'ил `platform` → пуши юзерам молча падали (ER_BAD_FIELD_ERROR в логе). **Fix:** миграция `022_push_platform.sql`.
47. **PowerShell + кириллица в API-тестах** — `Invoke-RestMethod -Body` и `curl -d` инлайн кодируют кириллицу в кодировке консоли → в БД `?`. Для тестов писать тело в файл (UTF-8 без BOM) и слать `curl --data-binary @file` или `Invoke-RestMethod` с байтами. Также: демо-юзеры смещены на 1 (admin = id 1, `userN@mail.ru` = id N+1).
48. **GDPR consent flow не был подключён к UI** — API `POST /api/consent` был, но фронт не вызывал его (тумблер только в localStorage), а при регистрации согласие не запрашивалось. **Fix:** чекбокс в `register.tsx` (блокировка submit без галочки, `consent` в теле запроса), `auth.js` пишет `consent_log` при `consent=true`, тумблеры в `settings.tsx`/`settings-privacy.tsx` вызывают `POST /api/consent`. Также добавлен полифилл `ResizeObserver` в `src/test/setup.ts` (Radix Checkbox требует его в jsdom).
49. **`users.verification_token/reset_token/reset_token_expires` отсутствовали в живой БД** — schema на диске их содержала, а live-таблица — нет: регистрация, forgot/reset-password, resend-verification и verify-email падали с `ER_BAD_FIELD_ERROR` (500). **Fix:** миграция `023_auth_tokens.sql` (3 колонки + индекс `idx_users_reset_token`).

---

## Prompt Templates for AI-ассистентов

### Создание компонента
```
Создай production-ready компонент [Название]:
- Props interface с JSDoc
- ForwardRef для форм
- Tailwind через cn()
- Loading + error состояния
- ARIA-атрибуты
- Контекст дизайн-системы из project-context.md
```

### Оптимизация
```
Проанализируй компонент на:
1. Ненужные re-renders (React.memo, useMemo, useCallback)
2. Bundle size (tree-shaking, dynamic imports)
3. Tailwind классы (конфликты, дублирование)
4. TypeScript strictness (any, type assertions)
Верни оптимизированную версию.
```

### Итеративный подход к фичам
1. Сначала архитектура: структура папок и data flow
2. Потом типы: TypeScript types и API contracts
3. Затем UI: презентационные компоненты без логики
4. Потом логика: state management + side effects
5. Наконец тесты: критические пути

### Chain-of-thought
Сначала объясни архитектурное решение, потом напиши код.
Ограничивай объём: «максимум 200 строк, без внешних библиотек кроме указанных».

### Функциональный аудит приложения
```
Проведи полный функциональный аудит веб-приложения SwiftMatch (дейтинг-приложение аналог Tinder).

Стек: React 18 + Vite + Tailwind (фронт), Express.js + MySQL (бэкенд), Socket.IO, Stripe, JWT.

### Что проверить:

1. АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ
   - Регистрация нового пользователя (валидация полей, уникальность email)
   - Логин (JWT выдаётся, refresh token работает)
   - Logout (токен инвалидируется на клиенте)
   - Forgot password → email с reset-link (проверить SMTP/nodemailer)
   - Verify email после регистрации
   - Dev-login для админки (без Supabase)

2. ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ
   - Создание анкеты (имя, возраст, фото, био, интересы, цели знакомства)
   - Редактирование профиля (PUT /api/profile/:id)
   - Загрузка фото через /api/upload (авторизация, лимит размера, тип файла)
   - Удаление аккаунта
   - Настройки приватности

3. ЛАЙКИ И МЭТЧИ
   - Свайп/лайк пользователя (лимит 10/день для free)
   - Мэтч при взаимном лайке (WebSocket уведомление)
   - Просмотр списка мэтчей (/matches)
   - Геопоиск по радиусу (Haversine формула)

4. ЧАТЫ
   - Создание чата при мэтче
   - Отправка сообщений (REST + WebSocket real-time)
   - История сообщений (пагинация)
   - "Печатает..." индикатор (typing indicator)
   - Прочтение сообщений (read receipts, CheckCheck/Eye иконки)
   - Emoji-реакции на сообщения
   - Удаление сообщений
   - Бан запрещённых слов (banned words filter)

5. ПРЕМИУМ / МОНЕТИЗАЦИЯ
   - Страница тарифов (/premium)
   - Stripe Checkout (реальный или mock?)
   - Success/cancel страницы после оплаты
   - Webhook обработка (подпись проверяется?)
   - Лимиты free vs premium (лайки, просмотры)
   - Отмена подписки

6. СОЦИАЛЬНЫЕ ФИЧИ
   - Группы (создание, вступление, категории)
   - Конкурс (голосование, лидерборд)
   - Онлайн-статус (зелёная точка через WS)

7. АДМИНКА
   - Доступ через /admin (dev-login работает?)
   - Дашборд со статистикой (chartData не падает с .slice?)
   - Управление пользователями (бан, имперсонация)
   - Управление фича-флагами (GET/PUT /api/admin/features)
   - Email-рассылки (nodemailer)
   - Push-уведомления (VAPID + web-push)
   - Модерация контента (фото, жалобы)
   - Управление ценами premium

8. ИНФРАСТРУКТУРА
   - /health роут отвечает
   - WebSocket heartbeat/reconnect
   - Sentry ловит ошибки (DSN настроен?)
   - Swagger документация доступна
   - Security headers (helmet)
   - CORS правильно настроен (не * в проде)

### Формат отчёта:

Для КАЖДОЙ функции укажи:
- Статус: ✅ Работает / ❌ Сломано / ⚠️ Частично / ❓ Не проверено
- Если сломано: точная ошибка (статус код, сообщение, traceback)
- Файлы/роуты, которые нужно починить
- Приоритет: 🔴 Блокер / 🟠 Высокий / 🟡 Средний / 🟢 Низкий

### Контекст проекта (текущее состояние — проверь перед аудитом):

- Все 124 server + 55 frontend тестов проходят (179/179, 0 failures) + E2E
- Stripe: mock заблокирован в production (NODE_ENV guard), idempotency-key middleware
- SMTP: Nodemailer + retry (3 попытки), ждёт SMTP_USER/PASS в .env
- WebSocket: pingInterval 10s, pingTimeout 5s, reconnect max 30s
- JWT_SECRET: 256-bit (не dev-secret-key)
- CORS: через env-переменную, fallback на * для Capacitor
- Админка: все 8 роутов есть, try/catch на всех, пустые ответы → [] или {}

### Как проверять:

1. Читай код в server/src/routes/ и src/pages/
2. Проверяй соответствие API-контрактов (что фронт шлёт = что бэк ждёт)
3. Ищи несоответствия между тестами и реализацией
4. Проверяй обработку ошибок (try/catch, fallback значения)
5. Сверяй с database/mysql_schema.sql — есть ли все колонки, которые использует код

Верни структурированный markdown-отчёт с таблицами по каждому разделу.
```

### Аудит связки Админка-БД-Приложение
```
Проведи аудит связки Админка ↔ База данных ↔ Приложение в SwiftMatch.

Цель: найти расхождения между тем, что админка показывает/меняет, тем, что хранится в MySQL, и тем, что видит конечный пользователь.

### 1. СХЕМА ДАННЫХ vs КОД

Проверь database/mysql_schema.sql против server/src/routes/admin/*.js:

| Что проверить | Как |
|---------------|-----|
| Все колонки, которые SELECT/INSERT/UPDATE в admin-роутах | Есть ли они в schema? |
| Типы данных совпадают? | INT vs VARCHAR, TIMESTAMP vs DATETIME |
| DEFAULT значения | Не сломается ли INSERT без них? |
| FOREIGN KEY constraints | Не нарушаются ли при DELETE в админке? |

Конкретно проверь:
- users / user_profiles / user_photos — связь 1:1 или 1:N?
- subscriptions — foreign key к users?
- feature_flags — есть ли таблица вообще?
- activity_log — какие action_type допустимы?
- banned_words — в БД или в файле?

### 2. ADMIN API vs БД

Для КАЖДОГО admin-роута проверь:
GET /api/admin/users
GET /api/admin/users/:id
PUT /api/admin/users/:id (ban/unban, role)
GET /api/admin/stats
GET /api/admin/analytics      ← 404? проверь существование файла
GET /api/admin/revenue        ← 404? проверь существование файла
GET /api/admin/features
PUT /api/admin/features
GET /api/admin/content/:section
PUT /api/admin/content/:section
GET /api/admin/reports
PUT /api/admin/reports/:id
POST /api/admin/newsletter
POST /api/admin/impersonate/:id

Для каждого:
- Какой SQL выполняется?
- Что возвращает при пустой БД? (null → 500 или []?)
- Есть ли try/catch?
- Возвращает ли массив для DataTable/Recharts? (❌ не {data: [...]})

### 3. ADMIN UI vs ADMIN API

Проверь src/pages/admin/*.tsx vs server/src/routes/admin/*.js:

| UI компонент | Ожидает от API | API реально возвращает | Расхождение? |
|--------------|----------------|------------------------|--------------|
| admin-users.tsx | массив пользователей | {users: [...]} или [...]? | |
| admin-stats.tsx | chartData массив | null при пустой БД? | |
| admin-features.tsx | [{name, enabled}] | объект с флагами? | |
| admin-dashboard.tsx | stats объект | какие поля? | |

Особое внимание:
- `users` endpoint: возвращает `role`, `premium_status`? Откуда берётся premium — из users.subscriptions или отдельный JOIN?
- `impersonate`: ставит ли cookie/token? Разлогинивает ли админа?
- `ban`: обновляет ли `users.is_banned`? Отправляет ли WS `user:banned`?

### 4. ИЗМЕНЕНИЯ В АДМИНКЕ → ПРИЛОЖЕНИЕ

Проверь цепочку: админка меняет → БД обновляется → приложение видит:

| Действие админа | Где в БД меняется | Как фронт узнаёт об изменении | Проблема? |
|-----------------|-------------------|-------------------------------|-----------|
| Бан пользователя | users.is_active = 0 | WS `user:banned`? Периодический poll? | |
| Изменение цен premium | subscriptions/pricing? | Приложение кэширует цены? | |
| Включить feature flag | feature_flags | FeatureFlagsProvider перечитывает? | |
| Удалить фото | user_photos | Мгновенно пропадает из профиля? | |
| Ответить на репорт | reports.status | Уведомление пользователю? | |

### 5. КОНКРЕТНЫЕ БАГИ (известные из контекста)

Проверь, починены ли:

- [ ] `GET /api/admin/analytics` — analytics.js существует?
- [ ] `GET /api/admin/revenue` — в monetization.js?
- [ ] `GET /api/admin/stats` — null guard?
- [ ] `GET /api/admin/users` — возвращает {users: [...]} или массив?
- [ ] `GET /api/admin/features` — объект или [{name, enabled}]?
- [ ] `PUT /api/admin/features` — 500 при невалидных данных?

### 6. БЕЗОПАСНОСТЬ СВЯЗКИ

- [ ] adminAuth — активный (401/403)? Гейт на `/api/admin` на месте? Публичен только `GET /api/admin/features`?
- [ ] Проверяется ли `req.user.role === 'admin'` ВНУТРИ каждого admin handler?
- [ ] SQL-инъекции: используются ли prepared statements? (?? в mysql2)
- [ ] IDOR: может ли админ изменить данные другого админа? Себя?

### Формат отчёта:

```markdown
## Результат аудита связки Админка-БД-Приложение

### 1. Схема vs Код
| Таблица | Проблема | Фикс |
|---------|----------|------|

### 2. Admin API
| Роут | Статус | Что сломано | Фикс |
|------|--------|-------------|------|

### 3. UI vs API
| Компонент | Ожидает | Получает | Расхождение |

### 4. Цепочка изменений
| Действие | БД обновляется? | Фронт узнаёт? | WS/Realtime? |

### 5. SQL-запросы с проблемами
```sql
-- Сейчас:
SELECT ...
-- Должно быть:
SELECT ...
### 6. Приоритеты фиксов
| Приоритет | Задача | Файлы |
```

### E2E-тест приложения (если есть доступ к runtime)
```
Запусти полный E2E-тест SwiftMatch:

1. Подними MySQL, сервер (port 3002), фронт (port 8081)
2. Прогони: npm test (фронт) + cd server && npm test (бэкенд)
3. Запусти Playwright: npx playwright test
4. Проверь вручную критические флоу:
   - Регистрация → подтверждение email → логин
   - Лайк → мэтч → открытие чата → отправка сообщения
   - Покупка premium (mock-режим) → проверка подписки в БД
   - Админка: логин → дашборд → бан пользователя
5. Проверь WebSocket: открой два браузера, отправь сообщение — приходит ли real-time
6. Проверь загрузку файла: попробуй загрузить 10MB PDF — должен отклонить

Верни отчёт со скриншотами упавших тестов и логами ошибок.
```

### Unit-тесты (language-context, feature-flags, use-websocket)
```
Добавь unit-тесты для:

1. `language-context.test.tsx` — проверка translation keys (RU/EN):
   - `t()` возвращает русскую строку для RU
   - `t()` возвращает английскую строку для EN
   - `t()` возвращает key если перевод не найден
   - Смена языка перерендеривает текст

2. `feature-flags-context.test.tsx` — API fallback, default flags:
   - Без Supabase флаги грузятся через GET /api/admin/features
   - При ошибке API — default flags (все true)
   - FeatureFlagsProvider передаёт корректные значения

3. `use-websocket.test.tsx` — connect/disconnect:
   - connect с токеном — socket открывается
   - connect без токена — socket не открывается
   - disconnect при unmount — clean up
```

### Починка chats.tsx Vite SyntaxError
```
При сборке Vite падает: `Expected '</', got 'jsx text'` в chats.tsx.
Причина: не хватает `</div>` для `<div data-testid="message-list">`.
Фикс: добавить закрывающий тег. Ломало /admin/messaging (триггерит lazy-загрузку chats.tsx).
```

### Починка settings-privacy.tsx
```
Страница /settings/privacy делает fetch к `/api/settings` — роут не существует (404).
Фикс: переписать на localStorage (аналогично main settings.tsx).
```

---

## 🏗️ Project Structure (SwiftMatch)

```
swiftmatch1bddomadm/
├── src/                          # Frontend (React 18 + Vite 8)
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives (через CLI)
│   │   ├── layout/               # Header, AppShell, BottomNav
│   │   ├── shared/               # ErrorBoundary, AdminGuard, PremiumGuard
│   │   └── forms/                # RHF + Zod формы
│   ├── pages/
│   │   ├── admin/                # Админка (8 страниц)
│   │   └── *.tsx                 # User-facing страницы
│   ├── hooks/                    # Кастомные хуки (use-websocket, use-premium...)
│   ├── context/                  # React.Context (Language, FeatureFlags...)
│   ├── lib/
│   │   ├── utils.ts              # cn() + общие утилиты
│   │   ├── native.ts             # Capacitor fetch-адаптер
│   │   └── constants.ts          # Translation keys, options
│   ├── shim/                     # Полифиллы next-navigation (useSearchParams)
│   ├── App.tsx                   # Root: Router → Layout → lazy routes
│   └── vite-env.d.ts
├── server/                       # Backend (Express.js)
│   └── src/
│       ├── index.js              # Express entry: helmet, cors, rate-limit, WS
│       ├── ws.js                 # Socket.IO server
│       ├── mail.js               # Nodemailer + retry
│       ├── logger.js             # Winston JSON logger
│       ├── sentry.js             # Sentry init + beforeSend
│       ├── redis.js              # ioredis lazy client
│       ├── banned-words.js       # Фильтр запрещённых слов
│       ├── middleware/           # auth.js, idempotency.js, adminAuth.js
│       └── routes/
│           ├── admin/            # dashboard, users, features, content, reports...
│           └── *.js              # auth, profile, social, premium, upload...
├── database/
│   ├── mysql_schema.sql          # Полная схема БД
│   ├── demo_data.sql             # Тестовые данные
│   └── migrations/               # Нумерованные миграции
├── android/                      # Capacitor нативный проект
├── scripts/                      # setup.ps1, backup-mysql, migrate
├── nginx/                        # swiftmatch.conf
├── .github/workflows/            # CI/CD (deploy.yml)
└── test_pages.mjs                # Playwright tests
```

## 🔄 CI/CD Pipeline (.github/workflows/deploy.yml)

```yaml
# GitHub Actions — lint → build → test → deploy
name: CI/CD
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit

  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env: { MYSQL_ROOT_PASSWORD: test, MYSQL_DATABASE: swiftmatch_test }
        options: --health-cmd="mysqladmin ping" --health-interval=10s
    steps:
      - uses: actions/checkout@v4
      - run: cd server && npm ci
      - run: mysql -h127.0.0.1 -uroot -ptest swiftmatch_test < database/mysql_schema.sql
      - run: cd server && npm test

  build-and-deploy:
    needs: [lint-and-typecheck, test]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npx vite build
      - run: cd server && npm ci
      # deploy step (scp / docker push / vercel)
```

## 📋 Git Workflow

| Правило | Значение |
|---------|----------|
| Ветки | `main` (production), `develop`, `feature/*`, `bugfix/*`, `hotfix/*` |
| Коммиты | `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:` |
| PR | TypeScript check + lint + tests passing |
| Секреты | `.env` в `.gitignore`, `.env.example` в репо |
| Husky | pre-commit: lint-staged (eslint + prettier). Использовать `git commit --no-verify` если changes проверены |

## 🧪 Testing Strategy

| Уровень | Инструмент | Команда | Что тестируем |
|---------|-----------|---------|--------------|
| Unit (frontend) | Vitest + RTL | `npm run test` | hooks, utils, компоненты |
| Unit (backend) | Vitest (mock mysql2) | `cd server && npm run test` | routes, middleware |
| E2E | Playwright | `npm run test:e2e` | 28+ pages, console errors, user flows |
| E2E (UI mode) | Playwright UI | `npm run test:e2e:ui` | Interactive debugging |
| API | Curl / tests | — | Healthcheck, все роуты |

### Unit-тесты (ключевые файлы)
- `language-context.test.tsx` — проверка translation keys (RU/EN), mock `t()`
- `feature-flags-context.test.tsx` — API fallback, default flags при отсутствии Supabase
- `use-websocket.test.tsx` — connect с токеном, null без токена, disconnect при unmount
- `auth-context.test.tsx` — login/logout, token lifecycle
- `use-premium.test.ts` — tiers, subscription status

### Playwright структура

```
e2e/
├── audit-full.spec.ts       # Полный аудит (health, auth, admin API, pages, chat)
├── login.spec.ts            # Существующие тесты логина
├── register.spec.ts         # Существующие тесты регистрации
├── profile.spec.ts          # Существующие тесты профиля
├── helpers/
│   ├── audit.ts             # console/network/page error tracker
│   └── api.ts               # apiCall(), loginViaApi(), healthCheck()
├── setup/
│   └── global-setup.ts      # Health check + DB verify перед тестами
└── visual/                  # Скриншотные тесты (будущие)
```

### Сценарии в `audit-full.spec.ts` (12 сьюитов)
1. `Health & Infrastructure` — API healthcheck, frontend loads без ошибок
2. `Registration flow` — регистрация через UI, затем логин
3. `Negative auth tests` — wrong password stays on /login, empty email validation
4. `Like → Match → Chat` (два пользователя) — API лайки user4→user5, проверка match, отправка сообщения
5. `Admin flow` — дашборд без ошибок, toggle feature flag, save/reset кнопки, search users
6. `Public pages` — /, /login, /register, /forgot-password без console errors
7. `Settings` — toggle switches, logout button
8. `Chat functionality` — открыть чат, проверить message input
9. `Groups` — открыть диалог создания
10. `Negative & security` — XSS в bio экранирован, wrong password, empty email
11. `WebSocket real-time` — сообщение появляется без перезагрузки
12. `WebSocket two-browser` — браузер A отправляет, браузер B получает без reload

### Конфигурация
- **screenshot**: `only-on-failure` — скриншот при падении
- **video**: `retain-on-failure` — видео при падении
- **trace**: `on-first-retry` — HAR + console + network на первом ретрае
- **reporter**: `html` + `json` (`test-results.json`) + `list`
- **globalSetup**: проверка `/health` + MySQL перед запуском

### Селекторы: `data-testid` (must have для ИИ-тестов)

Все интерактивные элементы должны иметь `data-testid`:

| Страница | Селектор | Где |
|----------|----------|-----|
| login.tsx | `[data-testid="email"]` | Input email |
| login.tsx | `[data-testid="password"]` | Input password |
| login.tsx | `[data-testid="phone"]` | Input phone |
| login.tsx | `[data-testid="submit-login"]` | Кнопка входа |
| register.tsx | `[data-testid="name"]` | Input имени |
| register.tsx | `[data-testid="email"]` | Input email |
| register.tsx | `[data-testid="password"]` | Input пароля |
| register.tsx | `[data-testid="submit-register"]` | Кнопка регистрации |
| forgot-password.tsx | `[data-testid="email"]` | Input email |
| forgot-password.tsx | `[data-testid="submit-forgot-password"]` | Кнопка отправки |
| settings.tsx | `[data-testid="switch-*"]` | Переключатели (push, email, location, discovery, incognito, data-consent) |
| settings.tsx | `[data-testid="logout-button"]` | Кнопка выхода |
| settings.tsx | `[data-testid="delete-account-button"]` | Кнопка удаления |
| profile-edit.tsx | `[data-testid="profile-name"]` | Input имени |
| profile-edit.tsx | `[data-testid="profile-bio"]` | Textarea био |
| profile-edit.tsx | `[data-testid="save-profile"]` | Кнопка сохранения |
| groups.tsx | `[data-testid="create-group-button"]` | Кнопка создать |
| groups.tsx | `[data-testid="group-name"]` | Input названия |
| groups.tsx | `[data-testid="group-description"]` | Textarea описания |
| groups.tsx | `[data-testid="submit-create-group"]` | Кнопка создания |
| search.tsx | `[data-testid="change-filters"]` | Кнопка фильтров |
| search.tsx | `[data-testid="prev-profile"]` | Назад |
| search.tsx | `[data-testid="next-profile"]` | Вперёд |
| search-filters.tsx | `[data-testid="apply-filters"]` | Применить фильтры |
| premium-success.tsx | `[data-testid="back-home-button"]` | На главную |
| admin-features.tsx | `[data-testid="save-features"]` | Сохранить флаги |
| admin-features.tsx | `[data-testid="reset-features"]` | Сбросить флаги |
| admin-users.tsx | `[data-testid="search-users"]` | Поиск пользователей |
| admin-messaging.tsx | `[data-testid="messaging-title"]` | Тема рассылки |
| admin-messaging.tsx | `[data-testid="messaging-body"]` | Текст рассылки |
| admin-messaging.tsx | `[data-testid="send-campaign"]` | Отправить |
| chats-chatId.tsx | `[data-testid="message-input"]` | Поле ввода сообщения |
| chats-chatId.tsx | `[data-testid="send-button"]` | Кнопка отправки |
| chats-chatId.tsx | `[data-testid="message-list"]` | Контейнер сообщений |
| chats.tsx | `[data-testid="message-input"]` | Поле ввода (десктопный чат) |
| chats.tsx | `[data-testid="send-button"]` | Кнопка отправки (десктопный чат) |
| chats.tsx | `[data-testid="chat-search"]` | Поиск чатов |
| activity.tsx | `[data-testid="reveal-profile"]` | Кнопка раскрытия профиля |
| contest.tsx | `[data-testid="close-photo-viewer"]` | Закрыть просмотр фото |
| safety.tsx | `[data-testid="add-contact-button"]` | Добавить контакт |
| safety.tsx | `[data-testid="save-contact-button"]` | Сохранить контакт |
| safety.tsx | `[data-testid="start-checkin-button"]` | Начать чек-ин |
| safety.tsx | `[data-testid="checkin-now-button"]` | Я в безопасности |

### Promt для DeepSeek: аудит через Playwright

```
Ты — senior QA engineer. У тебя есть:
- Playwright тесты в e2e/
- Работающее приложение на localhost:8081
- API на localhost:3002
- Отчёт playwright-report/

### Задача:
1. Запусти: npx playwright test --reporter=json
2. Для каждого FAILED теста:
   - Открой trace viewer: npx playwright show-trace test-results/{trace}.zip
   - Посмотри скриншот
   - Прочитай console errors
   - Найди соответствующий код в src/ и server/src/
3. Классифицируй ошибку:
   - FE: баг во фронтенде
   - BE: баг в API
   - DB: расхождение схемы и кода
   - TEST: тест неактуален (изменился UI)
4. Для каждой ошибки предложи фикс с конкретными файлами

### Формат ответа:
## Найдено X ошибок
### 1. [FE/BE/DB/TEST] Краткое описание
- **Тест:** e2e/...spec.ts:line
- **Причина:** что сломано
- **Код:** фрагмент с багом
- **Фикс:** конкретные изменения
- **Приоритет:** 🔴/🟠/🟡
```

## 🛡️ Security Rules (быстрый чеклист)

- `adminAuth` middleware — **ACTIVE** (с этапа 9): 401 без/невалидный токен, 403 не-админ. Единый гейт `app.use('/api/admin', ...)` в index.js; публичен только `GET /api/admin/features`; `dev-login` → 404 в production
- Все SQL-запросы — prepared statements (`??` в mysql2). Никакой конкатенации строк.
- Server-side только uuid для имён файлов, ограничение 5MB, только image/*
- CORS: `*` для Capacitor (dev), env-переменная для production
- Sentry beforeSend: фильтрует authorization, cookie, email, IP
- Stripe webhook: `express.raw({ type: 'application/json' })` ДО express.json()
- JWT: 256-bit ключ, 7d expiry, Bearer header
- **Auth-модель (этап 28, ADR):** основной Bearer-токен хранится в sessionStorage (`src/lib/token.ts`) — стандарт для SPA; переход на httpOnly cookie отложен: требует CSRF-защиты, credentials:include во всех 80+ fetch и переписывания E2E. Включать только отдельным этапом с полным прогоном тестов. НЕ добавлять новые sensitive токены (refresh_token) в storage — они в httpOnly-недоступных местах или БД (refresh_tokens)
- Rate limit: `/api/auth/` 60 req/min, общий `/api/` 30 req/s
- Helmet: CSP, X-Frame-Options, X-Content-Type-Options, и др. security headers
- Request ID: UUID на каждый запрос, X-Request-Id в ответе
- Модерация чатов: проверка banned-слов при отправке сообщений
- Бан пользователя + WS `user:banned` (мгновенный разлогин)

## 🚀 Production Deployment

### Подготовка
1. Вписать 7 ключей в `server/.env` (Stripe, SMTP, Sentry, S3, Redis, DB_PASSWORD, CORS_ORIGIN)
2. `npx vite build` — сборка фронта в `dist/`
3. `cd server && npm ci --production` — зависимости бэка

### Варианты хостинга
| Вариант | Плюсы | Минусы |
|---------|-------|--------|
| VPS (nginx + PM2) | Полный контроль | Ручное администрирование |
| Docker + VPS | Изолированно, healthcheck | Сложнее отладка |
| Railway / Fly.io | Простота, SSL | Меньше контроля |

### Nginx essentials
```nginx
location /api {
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400s;    # для WebSocket
    client_max_body_size 10M;     # для фото
}

location / {
    root /app/dist;
    try_files $uri $uri/ /index.html;  # SPA fallback
}
```
