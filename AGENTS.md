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
15. **export/import — проверять именованный экспорт** — перед `import { X } from 'y'` убедиться, что `y.js` экспортирует `X` именно как named export (`export function X` / `export const X`), а не как обычную функцию. Обычная function без `export` = ReferenceError при импорте = сервер не стартует.
16. **Redis/внешние сервисы — без проверки не подключать** — никогда не использовать Redis-backed store (rate-limit-redis, ioredis adapter) без предварительной проверки `getRedis()` → `client.status === 'ready'`. Если Redis недоступен — in-memory fallback. Иначе `async error during store initialization` убивает **все** запросы через глобальный error handler (500 на каждом роуте).
17. **Admin Content — цепочка данных** — `admin-content.tsx` читает из `GET /api/content` (публичный), пишет в `PUT /api/admin/content/{section}`. Сервер читает ВСЕ колонки, заменяет ТОЛЬКО одну, пишет обратно. Запрещено: трогать `getContentConfig()` в `content.js`, удалять `invalidateContentCache()` после PUT, хардкодить banned-words для чат-модерации. Три отдельные системы banned-words: `content_config` (БД, чаты), `constants.ts` (хардкод, профиль), `groups.tsx` (хардкод, группы).
18. **handleSave внутри setState updater'а** — НИКОГДА не вызывать async side effects (fetch, save, API) внутри `setState(prev => {...})`. Паттерн: вычислить `next` из текущего state, вызвать `setState(next)`, потом `handleSave(next)` снаружи. Иначе React batching может отправить устаревшие данные.
19. **Autosearch: проверять формат ключей из разных источников** — данные из БД (`content_config`), demo-data, и фильтры могут хранить ключи в разных форматах (`interest.sport` vs `sport`). При сравнении — нормализовать. Город-фильтр: проверять и `"all"`, и `"Все"`.
20. **Dynamic import скрывает ошибки пропсов** — `dynamic(() => import(...))` не проверяет пропсы компонента. Если компонент требует 10 required props, а передано 3 — TypeScript молчит, кнопка крашится в рантайме. При динамическом импорте — всегда сверять пропсы по interface.
21. **bat-файлы: проверять все пути** — при копировании `запуск-всего.bat` между проектами/папками нужно обновлять ВСЕ `cd /d` пути, иначе MySQL/Node стартуют из несуществующей директории.

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

## Startup reminder
- After `git pull noutadm main` in `C:\swiftmatch1bd` (the run directory), also run `cd server && npm install` if new packages were added.
- Kill old node processes: `Get-Process -Name "node" | Stop-Process -Force`
- Start server: `cd C:\swiftmatch1bd\server && node src/index.js` — **обязательно из `server/`**: `import 'dotenv/config'` грузит `.env` относительно CWD; при запуске из корня `JWT_SECRET()` вернёт случайный секрет, все токены «сгорят» → 401 на всех эндпоинтах (проверка: `npm run check:ports` фейлит без JWT_SECRET в server/.env)
- Start frontend: `cd C:\swiftmatch1bd && npx vite --port 8081 --host`
- **Инфра может умереть сама:** mysqld падал с `RADAR_PRE_LEAK_64` (нехватка памяти под нагрузкой E2E: 3 chromium + node + vite + mysql), vite может завершиться при закрытии Laragon/перезагрузке. Признак: `ERR_CONNECTION_REFUSED` на 8081/3002, глобальный health фейлит в global-setup. Подъём: `Start-Process C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqld.exe --defaults-file=...\my.ini` (или Laragon), сервер/фронт — командами выше. Первый E2E-прогон после холодного старта может дать флаки (vite компилирует модули) — retries: 1 локально, 2 в CI уже настроены.

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

## What to NEVER do (absolute bans)

- **Никогда** не коммитить `.env` с реальными секретами. `.env` в `.gitignore`, `.env.example` — в репо
- **Никогда** не оставлять `console.log` в продакшен-логике платежей, писем, авторизации. Использовать `req.log` (структурированный лог) или winston
- **Никогда** не добавлять `cors({ origin: '*' })` в веб-версии продакшена. Только для Capacitor (`native.ts` определяет режим)
- **Никогда** не использовать `fs.writeFile` для пользовательских загрузок без валидации пути. Только uuid имена, только `/uploads/` директория
- **Никогда** не возвращать `adminAuth` из активного в пассивный/blocking-режим и не снимать гейт `/api/admin` — это откроет админку без авторизации. `dev-login` в production возвращает 404 — не открывать его заново
- **Никогда** не хранить `refresh_token` в localStorage/Preferences без httpOnly альтернативы. (Сейчас проект использует Bearer в заголовке — это ок, но не добавлять новые sensitive токены в storage)

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

---

## 🛡️ Security Rules (быстрый чеклист)

- `adminAuth` middleware — **ACTIVE** (с этапа 9): 401 без/невалидный токен, 403 не-админ. Единый гейт `app.use('/api/admin', ...)` в index.js; публичен только `GET /api/admin/features`; `dev-login` → 404 в production
- **ПРАВИЛО adminAuth (qwen #1, этап 37):** защита админ-эндпоинтов — ТОЛЬКО через active-check middleware `adminAuth` (сам валидирует JWT и роль, сам отвечает 401/403). ЗАПРЕЩЕНО: (а) пассивные проверки вида `if (!req.user) next()` без ответа; (б) ручные проверки `req.user.role !== 'admin'` внутри хендлеров вместо middleware; (в) обход/удаление единого гейта `app.use('/api/admin', adminAuth)`. Новые админ-роуты наследуют защиту автоматически; проверка при ревью: запрос без токена обязан вернуть 401 ДО логики хендлера
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

---
**Extended docs:** [Architecture](docs/architecture.md) | [Past Mistakes](docs/past-mistakes.md)
