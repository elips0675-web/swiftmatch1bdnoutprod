# SwiftMatch1BD — Тестовая копия с локальной БД

Клон [основного репозитория](https://github.com/elips0675-web/swiftmatch-vite-react1-production1) для тестирования с **реальной MySQL-БД** через локальный API-сервер.

Отличается от оригинала:
- **Бэкенд:** Node.js/Express + MySQL (Laragon), а не Supabase
- **Данные:** демо-данные (3 пользователя, чаты, сообщения, группы, посты)
- **Порт API:** 3002 (чтобы не конфликтовать с оригиналом на 3001)
- **Порт фронта:** 8081

---

## Быстрый старт

### 1. MySQL (Laragon)

Убедитесь, что MySQL запущен. База `swiftmatch` уже создана со схемой и демо-данными.

Импортировать заново:
```bash
mysql -u root swiftmatch < database\mysql_schema.sql
mysql -u root swiftmatch < database\demo_data.sql
```

### 2. API сервер

```bash
cd server
npm install
node src/index.js
# → http://localhost:3002
```

### 3. Фронтенд

```bash
npm install
npx vite --port 8081 --host
# → http://localhost:8081
```

---

## Данные для входа

| Email | Пароль | Роль |
|-------|--------|------|
| `admin@mail.ru` | `admin123` | Админ |
| `demo@mail.ru` | `admin123` | Анна (пользователь) |
| `user4@demo.ru` … `user23@demo.ru` | `admin123` | 18 демо-пользователей |

> После `git pull` запустить `node seed-users.cjs` в `server/` если добавились новые demo-пользователи.

---

## Функционал (готово)

### Фаза 1 — Core User Flow ✅
- Регистрация → анкета → лайки → мэтч → чат
- Загрузка фото через `/api/upload` (auth + JWT, fallback для demo)
- Онбординг с сохранением в MySQL + fallback localStorage
- Bearer-токен авторизация

### Фаза 2 — Social Features ✅
- `/matches` — страница мэтчей
- `/premium` — тарифы, покупка подписки
- Группы: создание, вступление, категории
- Конкурс: голосование, лидерборд
- Онлайн-статус (зелёная точка) через WebSocket
- Typing indicator («печатает…»)

### Фаза 3 — Admin & Moderation ✅
- Email-рассылки (nodemailer/SMTP)
- Push-уведомления (VAPID + web-push)
- Бан + WS `user:banned` (разлогин)
- Запрещённые слова в чатах (REST + WS)
- История действий в карточке юзера
- Имперсонация (войти как пользователь)
- **Реальный premium-статус** в админке (из `subscriptions`)

### Фаза 4 — Monetization ✅
- **Платёжный шлюз:** Stripe Checkout + mock fallback, отмена подписки
- **Stripe webhook:** проверка подписи через `express.raw()`
- **Stripe success/cancel:** страницы `/premium/success`, `/premium/cancel`
- **Премиум-гейтинг:** лимит 10 лайков/день для free, просмотры скрыты без подписки
- **Рекламные баннеры:** фича-флаг `showAds`, сохранение конфига рекламы в БД
- **UI:** выбор тарифа (Plus/Gold/Platinum) + длительности (1/6/12 мес.)
- **Админка:** управление ценами, рекламными блоками (Google AdMob / Yandex)

### Фаза 5 — Polish & Advanced ✅
- Геопоиск по радиусу (Haversine)
- История просмотров (profile_view → activity_log)
- AI-рекомендации (compatibility_scores)
- Сохранение attachment-теста
- Удаление сообщений
- Системные уведомления (SW + Push)
- Боты (11 демо-ботов автолайкают + пишут в чат)
- i18n (RU/EN)

### Фаза 6 — Infrastructure & Real-time ✅
- WebSocket-клиент (`socket.io-client`) подключён к серверу
- Real-time доставка сообщений через `chat:message` event
- VAPID-ключи сгенерированы, push-уведомления рабочие
- Stripe пакет установлен
- Порт Vite унифицирован (8081)
- UTF-8 кодировка на всех уровнях (БД, сервер, HTML)
- Очистка мусорных данных (чаты, participants)
- **helmet** — security headers (CSP, X-Frame-Options, X-Content-Type-Options и т.д.)
- **Request ID** — каждый запрос получает UUID, `X-Request-Id` в ответе, `req.log` для структурированного логирования
- **CSRF** — не нужен (API-only, JWT в `Authorization` header, без кук-сессий)

### Фаза 7 — Testing & Production Infrastructure ✅
- **Фронтенд-тесты (Vitest):** 42 теста, 8 файлов (`login`, `register`, `error-boundary`, `auth-context`, `use-premium`, `example`, `utils`, `api`)
- **Серверные тесты (Vitest):** 6 файлов (`auth`, `profile`, `premium`, `admin`, `social`, `middleware`)
- **E2E (Playwright):** `playwright.config.ts`, `e2e/login.spec.ts`, `register.spec.ts`, `profile.spec.ts`
- **Sentry:** `src/lib/sentry.ts` + `server/src/sentry.js` (инициализация в `main.tsx` и `server/src/index.js`)
- **Swagger:** `server/src/swagger.js` + JSDoc-аннотации к routes (auth, profile, premium, social)
- **Docker:** multi-stage `Dockerfile` (healthcheck, `node:20-alpine`, `USER node`) + `docker-compose.yml` (healthcheck для db)
- **Nginx:** `nginx.conf` (SPA fallback, API proxy, SSL, WebSocket, security headers)
- **Prettier:** `.prettierrc` с настройками
- **Husky + lint-staged:** `.husky/pre-commit` запускает prettier+lint на staged файлах

---

## Что доделать до продакшена

### 🔴 БЛОКЕРЫ (нельзя деплоить)

1. **Безопасность — dev-секреты**
   - `JWT_SECRET=dev-secret-key` → сгенерировать 256+ бит случайных символов
   - `DB_PASSWORD=` (пустой) + `DB_USER=root` → создать пользователя `swiftmatch_prod` с ограниченными правами
   - `CORS_ORIGIN=http://localhost:8081` → заменить на домен прода

2. **Админка — исправлено**
   - ✅ `/api/admin/analytics` — создан `analytics.js` (overview, retention, revenue-mix, registrations)
   - ✅ `/api/admin/health` — добавлен `/health` роут
   - ✅ `dashboard.js` — chartData обёрнуты в `ensureArray()` на фронте
   - `/api/admin/revenue` → роут называется `monetization.js` (работает как `/api/admin/monetization/revenue`)

3. **Stripe — mock-fallback**
   - `STRIPE_SECRET_KEY` не заполнен, платежи не проходят
   - Убрать mock-ветку из прода или оставить только для `NODE_ENV=test`
   - Добавить `idempotency_key` на `checkout.sessions.create`

4. **SMTP — письма не уходят (исправлено)**
   - ✅ Retry-логика (3 попытки, exponential backoff) в `server/src/mail.js`
   - ✅ Проверка пустых `SMTP_USER`/`SMTP_PASS` — graceful skip
   - `SMTP_USER`/`SMTP_PASS` не заполнены (нужны реальные credentials)

### 🟠 ВЫСОКИЙ ПРИОРИТЕТ

5. **Реклама — таймер вместо SDK (исправлено)**
   - ✅ AdMob: динамический импорт `@capacitor-community/admob` с fallback на `setTimeout`
   - ✅ `adUnitId` можно менять через админку (`/api/admin/monetization/ads`)
   - Для реальной монетизации: `npm install @capacitor-community/admob` + нативная сборка

6. **Sentry — инициализирован** ✅
   - ✅ `@sentry/react` (фронт) + `@sentry/node` (бэк) установлены
   - ✅ `init()` с `beforeSend` — фильтрация PII (email, токены, пароли)
   - ✅ `server/src/sentry.js` — подключен Express requestHandler/errorHandler
   - ✅ `src/lib/sentry.ts` — клиентский init
   - `SENTRY_DSN` не вписан (нужен DSN из sentry.io)

7. **WebSocket — heartbeat + reconnect (исправлено)** ✅
   - ✅ Сервер: `pingInterval: 10000`, `pingTimeout: 5000`
   - ✅ Клиент: `reconnectionAttempts: Infinity`, `reconnectionDelayMax: 30000`, `randomizationFactor: 0.5`

8. **БД — миграции (исправлено)** ✅
   - ✅ Система в `database/migrations/` — нумерованные .sql файлы + `migrate.js`
   - ✅ Две миграции: `001_add_moderation_columns.sql`, `002_add_subscription_indexes.sql`

9. **Загрузка файлов — ограничения (исправлено)** ✅
   - ✅ MIME-фильтр: `file.mimetype.startsWith('image/')` + проверка расширения
   - ✅ `fileSize: 10MB`
   - ✅ S3 scaffold: lazy-init с `@aws-sdk/client-s3` + `multer-s3` (при наличии env — S3, иначе локальный диск)

### 🟡 СРЕДНИЙ ПРИОРИТЕТ

10. **Починить 9 server-тестов**
    - `admin.test.js` (7) — создать `analytics.js`, переименовать `monetization.js` → `revenue.js`, обернуть SQL в `|| []`
    - `profile.test.js` (1) — мок должен возвращать `display_name` после UPDATE
    - `social.test.js` (1) — мок чатов должен возвращать messages с reactions

11. **Playwright E2E — добавить webServer в конфиг**
    ```ts
    webServer: { command: 'cd server && node src/index.js', url: 'http://localhost:3002/health', timeout: 120000 }
    ```
    + добавить `/health` роут в Express

12. **Docker — исправлено** ✅
    - ✅ `.dockerignore` создан (исключает `node_modules`, `.git`, `.env`)
    - ✅ `docker-compose.yml`: `restart: unless-stopped` добавлен
    - `mem_limit` — опционально

13. **Nginx — исправлено** ✅
    - ✅ `nginx/swiftmatch.conf` — rate limiting, `client_max_body_size 20M`, WebSocket `proxy_read_timeout 86400s`
    - ✅ SSL, static files, SPA fallback

14. **Логи — Winston** ✅
    - ✅ `server/src/logger.js` переписан на `winston`
    - ✅ JSON-формат с timestamp, level, msg, rid
    - ⚠️ Часть `console.log` ещё осталась в старых роутах

### 🟢 НИЗКИЙ ПРИОРИТЕТ

15. **Кэширование**: Redis scaffold готов (`server/src/redis.js`, `ioredis` установлен), ждёт `REDIS_URL`

16. **Бэкапы MySQL**: `mysqldump` cron или RDS automated backups

17. **CI/CD**: ✅ GitHub Actions — `.github/workflows/deploy.yml` (lint → build → test с MySQL)

### 📋 План по неделям

| Неделя | Задачи |
|--------|--------|
| Неделя 1 | Сменить dev-секреты (JWT, DB пароль). Починить 9 server-тестов. Добавить `/health` роут ✅ и запустить Playwright ✅. Починить admin → ✅ analytics.js создан |
| Неделя 2 | Stripe live + webhook → ✅ idempotency + STRIPE_LIVE. SMTP (Resend/SES) → ✅ retry-логика. Sentry DSN → ✅ @sentry/* + beforeSend. ✅ `noValidate` на формы |
| Неделя 3 | ✅ Миграции БД (database/migrations/). ✅ Загрузка на S3 + валидация. 🟡 Redis scaffold. ✅ Rate limiting (работало) |
| Неделя 4 | ✅ Docker: `.dockerignore`, `restart`. ✅ Nginx: rate limit, body size, WS timeouts. ✅ CI/CD (GitHub Actions). 🟡 AdMob scaffold |

### Осталось (требует реальных ключей/сервисов):
- `server/.env`: `STRIPE_SECRET_KEY`, `SMTP_USER`/`PASS`, `SENTRY_DSN`, `REDIS_URL`, `AWS_*` (S3)
- `.env`: `VITE_SENTRY_DSN`
- Починить 9 server-тестов (admin, profile, social)

---

## Структура

| Папка | Назначение |
|-------|------------|
| `server/` | API на Express + MySQL (маршруты: auth, profile, social, chats, groups, contest, premium, reports, notifications, admin) |
| `server/src/routes/admin/` | Админка (dashboard, users, analytics, reports, content, features, messaging, monetization, media) |
| `server/src/ws.js` | Socket.IO (чат, уведомления, онлайн-статус) |
| `src/` | Фронтенд на React + Vite + Tailwind |
| `database/` | `mysql_schema.sql` + `demo_data.sql` |

## Capacitor Android

Нативное Android-приложение через Capacitor (WebView + нативные плагины).

### Структура
- `android/` — Gradle-проект (в git)
- `capacitor.config.ts` — конфиг (appId, webDir, plugins)
- `src/lib/native.ts` — адаптер fetch/WS для нативного режима

### Требования
- Android Studio (скачать [developer.android.com/studio](https://developer.android.com/studio))
- JDK 17+
- Android SDK (устанавливается через Android Studio)

### Сборка APK
```bash
VITE_API_URL=https://swiftmatch.app npm run build:native
```
После сборки открыть `android/` в Android Studio → **Build → Build Bundle(s) / APK**.

### Live Reload (отладка на устройстве)
Запустить на ПК:
```bash
npm run dev
```
В другом терминале (устройство в той же сети):
```bash
npx cap run android --livereload=http://192.168.x.x:8081 --open
```

### Нативные фичи
- **Камера**: `@capacitor/camera` — нативный UI фото/видео
- **Файлы**: `@capacitor/filesystem`
- **Хранилище**: `@capacitor/preferences` (замена localStorage)
- **Пуши**: VAPID-ключи в `server/.env` готовы

### Как это работает
На сервере настроен `cors({ origin: '*' })` — подходит для Capacitor.
В нативном режиме `src/lib/native.ts` перехватывает все `fetch('/api/...')` и подставляет `VITE_API_URL`.
WebSocket в `use-websocket.ts` использует `VITE_WS_URL` или `wss://swiftmatch.app`.

---

## Настройка .env

`server/.env` уже настроен для локальной работы:
```
PORT=3002
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=swiftmatch
CORS_ORIGIN=http://localhost:8081
JWT_SECRET=swiftmatch-dev-secret-change-in-production
VAPID_PUBLIC_KEY=BEygaffoNfy9XaaH0QqILW1Kzuf-7WoVL4oAvQpC1ebFkZ8X828d8Fv8TXcqBuykDK4IWJdZMA6TOkQfSBP8N8o
VAPID_PRIVATE_KEY=b370faewrsuKX2yUXBZ-2-axZiScdesTmpXHPq0yJN4
```
