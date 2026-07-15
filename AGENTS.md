# Project Notes

> **Before starting any task:** Read `## Golden Rule: Production ≠ File Created` and run the Pre-flight Checklist.

## System Prompt (для AI-ассистентов)

Ты — senior React-разработчик SwiftMatch (дейтинг-приложение). Твой стек:
- React 18 (Concurrent Features, hooks), Vite 8 (ESM, HMR), TypeScript 5 (strict)
- Tailwind CSS v3 (config-based, не v4), shadcn/ui (Radix primitives)
- React Router v6, TanStack React Query v5, React Hook Form + Zod
- Framer Motion для анимаций, Socket.IO для real-time
- Express.js / MySQL (бэкенд)
- i18n: кастомный LanguageContext (RU/EN)

Правила генерации кода:
1. Только функциональные компоненты + hooks, строгая типизация props
2. Tailwind классы через `cn()` (clsx + tailwind-merge) из `src/lib/utils.ts`
3. UI-тексты обязательно через `t()` — БД хранит ключи переводов (не рус/англ)
4. Анимации через Framer Motion или Tailwind transitions
5. Формы — React Hook Form + Zod
6. Серверное состояние — TanStack Query, клиентское — Context
7. Error boundaries, loading states, accessibility (ARIA)
8. Все данные в БД/state — translation keys (`interest.sport`, не `"Спорт"`)
9. Сортировка translated-списков: `t(item).localeCompare(t(item2))`
10. Стили бейджей в admin-content.tsx не менять

Контекст проекта: `project-context.md`

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

- Admin save (`PUT /api/admin/content/:section`) goes through `adminAuth` middleware in `server/src/index.js`
- NEVER add auth checks to admin routes (`/api/admin/*`) — the project uses dev-login auto-auth
- `AdminGuard` in `src/components/shared/admin-guard.tsx` must ALWAYS try `dev-login` when Supabase is absent
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

## Startup reminder
- After `git pull noutadm main` in `C:\swiftmatch1bd` (the run directory), also run `cd server && npm install` if new packages were added.
- Kill old node processes: `Get-Process -Name "node" | Stop-Process -Force`
- Start server: `cd C:\swiftmatch1bd\server && node src/index.js`
- Start frontend: `cd C:\swiftmatch1bd && npx vite --port 8081 --host`

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
- [ ] `.env` содержит `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (или fallback на Mailgun/Resend API key)
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

- [ ] `adminAuth` middleware остаётся passive (вызывает `next()` на ошибке) — не делать его блокирующим
- [ ] Но каждый PUT/POST/DELETE в админке должен проверять `req.user.role === 'admin'` внутри самого хендлера
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
- **Никогда** не менять `adminAuth` middleware с passive на blocking. Это сломает dev-login и админку
- **Никогда** не хранить `refresh_token` в localStorage/Preferences без httpOnly альтернативы. (Сейчас проект использует Bearer в заголовке — это ок, но не добавлять новые sensitive токены в storage)

---

## Past mistakes (fixed, do NOT repeat)

1. **Admin save 401** — admin routes require JWT. Keep `adminAuth` middleware PASSIVE (call `next()` on failure, don't block). `/api/admin/me` has its own auth check — leave it alone.
2. **Education badge styling** — Don't change `py`, `px`, `rounded-*`, `border-*`, or any visual classes in `admin-content.tsx` unless asked. The user wants them identical to interests.
3. **Stale token redirect loop** — When Supabase is absent, AdminGuard must ALWAYS try dev-login. The `!getToken()` guard causes redirect to `/login` if a stale token exists.
4. **Translation keys** — DB stores slugs (`secondary`, `sport`) without prefix. Frontend adds `education.`/`interest.` prefix via `t()`. Never store Russian/English text in DB.
5. **Server port** — Server runs on **3002**, not 3001. Vite proxy, server .env, and any tooling must all agree on 3002.
6. **Feature flags** — Must load from both Supabase AND API fallback. When adding a new flag, register it in: (a) `server/src/routes/admin/features.js` (GET + PUT), (b) `feature-flags-context.tsx` (interface + mapper + fetch), (c) `admin-features.tsx` (table rows).
7. **Admin routes protection** — `adminAuth` middleware is passive (calls `next()` on failure). Don't make it blocking — the frontend's `AdminGuard` handles auth.
8. **UTF-8 only** — All `.ts`, `.tsx`, `.js`, `.jsx` files MUST be UTF-8. UTF-16 BE causes parse errors and infinite recursion in some editors.
9. **vi.mock factory + hoisting** — `vi.mock()` is hoisted above `const` declarations. Always use `vi.hoisted(() => vi.fn())` to create mocks referenced inside `vi.mock` factories. Using plain `vi.fn()` causes ReferenceError (TDZ).
10. **jsdom constraint validation** — jsdom blocks form `submit` event if a `required` field is empty or `type="email"` has invalid value. Always add `noValidate` to `<form>` elements that use custom JS validation (standard practice).
11. **git stash untracked files** — `git stash` (without `-u`) does NOT stash untracked files. Lint-staged automatic backup also doesn't include untracked files. When troubleshooting stash operations, use `git stash show -p` to verify content, and restore with `git restore --source <stash-hash> --worktree -- .` from the unreachable commit.
12. **Husky pre-commit + eslint** — The `.husky/pre-commit` runs `lint-staged` which runs eslint + prettier. If the hook fails, it stash-pop's working changes and can lose untracked files. Use `git commit --no-verify` when the changes are verified (tests pass, build succeeds) to avoid hook interference.

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
