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

## Функционал

### 👤 Пользовательский опыт
- Регистрация, анкета, лайки, мэтчи, чаты — полный цикл знакомств
- Геопоиск по радиусу (Haversine formula)
- AI-рекомендации на основе `compatibility_scores`
- Attachment-тест для психологической совместимости
- Системные и push-уведомления (Service Worker + VAPID)
- 11 демо-ботов для тестирования (автолайки + сообщения)
- i18n (русский / английский), все данные — translation keys

### 💳 Монетизация
- **Stripe Checkout** — три тарифа (Plus / Gold / Platinum), длительность 1/6/12 мес.
- **Idempotency-Key middleware** — защита от двойных списаний
- **STRIPE_LIVE** — при `true` mock отключается; без ключа → 500
- **Premium-гейтинг:** лимит 10 лайков/день для free, скрытые просмотры
- **Реклама:** фича-флаг `showAds`, конфиг AdMob/Yandex в БД, динамический импорт с `setTimeout`-fallback
- **Админка:** управление ценами и рекламными блоками

### 🛠️ Админ-панель
- Дашборд со статистикой (пользователи, активность, матчи, выручка, подписки)
- Аналитика: retention, revenue-mix, регистрации (4 endpoint: `/analytics/overview`, `/retention`, `/revenue-mix`, `/registrations`)
- Управление пользователями: поиск, фильтры, бан/разбан, массовые операции, имперсонация
- Фича-флаги: 7 toggle'ов, сохраняются в БД (с валидацией пустого body)
- Модерация: жалобы, запрещённые слова, история действий
- Контент: управление интересами, целями знакомств
- Premium-статус в карточке пользователя (из `subscriptions`)

### 💬 Социальные функции
- Real-time чаты через **Socket.IO** с typing indicator и read receipts
- Emoji-реакции на сообщения (happy / love / sad / angry / like)
- Онлайн-статус (зелёная точка) через WebSocket
- Группы по интересам: создание, категории, посты, комментарии, лайки
- Конкурс с голосованием и лидербордом
- Блокировка пользователей

### 🔐 Безопасность и инфраструктура
- JWT (Bearer token), refresh tokens, dev-login для админки
- **Sentry:** `@sentry/react` + `@sentry/node`, `beforeSend` фильтрует PII (email, токены, пароли)
- **Helmet:** CSP, X-Frame-Options, X-Content-Type-Options и др. security headers
- **Request ID:** UUID на каждый запрос, `X-Request-Id` в ответе
- **Rate limiting:** express-rate-limit (30r/s на лайки, 5r/s на auth)
- **Модерация чатов:** проверка banned-слов при отправке сообщений
- Бан пользователя + WS `user:banned` (мгновенный разлогин)
- CORS `*` (для Capacitor), CSRF не нужен (API-only JWT)

### 📁 Загрузка файлов
- MIME-фильтр: только `image/*` + whitelist расширений (.jpg, .jpeg, .png, .gif, .webp)
- `fileSize: 10MB`
- **S3 scaffold:** lazy-init — при наличии AWS_* env → `@aws-sdk/client-s3` + `multer-s3`, иначе локальный диск

### 🗄️ База данных
- MySQL через mysql2, пул соединений
- **Миграции:** `database/migrations/` — нумерованные .sql + `migrate.js` (таблица `_migrations`)
- Schema: users, profiles, photos, interests, matches, chats, messages, reactions, subscriptions, activity_log, feature_flags, reports и др.

### 📧 Коммуникации
- **SMTP:** Nodemailer с retry-логикой (3 попытки, exponential backoff 1s/2s/3s)
- Graceful skip при пустых SMTP_USER/PASS
- Push-уведомления через VAPID + web-push

### 🧪 Тестирование
- **Фронтенд (Vitest):** 42 теста, 8 файлов (login, register, error-boundary, auth-context, use-premium, utils, api)
- **Сервер (Vitest):** 56 тестов, 6 файлов (auth, profile, premium, admin, social, middleware) — **0 failures**
- **E2E (Playwright):** 3 spec-файла (login, register, profile) + webServer в конфиге
- **Swagger:** OpenAPI-документация с JSDoc-аннотациями

### 🐳 DevOps
- **Docker:** multi-stage (node:20-alpine), healthcheck, USER node, `.dockerignore`, `restart: unless-stopped`
- **Nginx:** rate limiting (api 30r/s, auth 5r/s), `client_max_body_size 20M`, WebSocket 86400s, SSL, SPA fallback
- **CI/CD:** GitHub Actions (lint → build → test с MySQL-сервисом)
- **Git hooks:** Husky + lint-staged (prettier + eslint на staged файлах)
- **Логирование:** Winston (JSON, timestamp/level/msg/rid)

### 📱 Capacitor Android
- Нативная камера (`@capacitor/camera`), файлы (`@capacitor/filesystem`), Preferences
- Адаптер fetch/WS для нативного режима (`src/lib/native.ts`)
- Live Reload на устройстве через `npx cap run android --livereload`

---

## Что осталось до продакшена

### 🔴 Требуют реальных ключей/сервисов (код готов)

| Переменная | Файл | Назначение |
|---|---|---|
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | `server/.env` | Реальные платежи |
| `SMTP_USER`, `SMTP_PASS` | `server/.env` | Email (регистрация, сброс пароля) |
| `SENTRY_DSN` | `server/.env` + `.env` | Мониторинг ошибок |
| `REDIS_URL` | `server/.env` | Кэш + rate-limit |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET` | `server/.env` | Облачное хранение файлов |
| `DB_PASSWORD` | `server/.env` | Непустой пароль для MySQL |
| `CORS_ORIGIN` | `server/.env` | Домен прода (вместо `localhost:8081`) |

### 🟡 Нужно доделать (код частично готов)

- Установить `@capacitor-community/admob` для реальной рекламы в нативной сборке (`npm install`)
- Заменить `console.log`/`console.error` на winston в старых роутах
- `mem_limit` в `docker-compose.yml` (опционально)

### 🟢 Опционально

- Настроить `mysqldump` cron для бэкапов MySQL
- Включить Redis (`REDIS_URL`) для кэширования сессий и совместимости

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

`server/.env` уже настроен для локальной работы (реальный `JWT_SECRET` сгенерирован, не показан в README):
```
PORT=3002
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=swiftmatch
CORS_ORIGIN=http://localhost:8081
# JWT_SECRET=*** (256-bit, сгенерирован)
VAPID_PUBLIC_KEY=BEygaffoNfy9XaaH0QqILW1Kzuf-7WoVL4oAvQpC1ebFkZ8X828d8Fv8TXcqBuykDK4IWJdZMA6TOkQfSBP8N8o
VAPID_PRIVATE_KEY=b370faewrsuKX2yUXBZ-2-axZiScdesTmpXHPq0yJN4
```
