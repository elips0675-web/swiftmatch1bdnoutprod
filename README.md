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

2. **Админка падает 500/404**
   - `/api/admin/analytics` — 404 (файл не создан)
   - `/api/admin/revenue` — 404 (роут называется `monetization.js`)
   - `/api/admin/stats` — 500 (`dashboard.js` итерирует null из БД)
   - `/api/admin/users` — возвращает `{users: [...]}` вместо массива
   - `/api/admin/features` — возвращает объект вместо массива

3. **Stripe — только mock-fallback**
   - `STRIPE_SECRET_KEY` не заполнен, платежи не проходят
   - Убрать mock-ветку из прода или оставить только для `NODE_ENV=test`
   - Добавить `idempotency_key` на `checkout.sessions.create`

4. **SMTP — письма не уходят**
   - `server/src/mail.js` только логирует в консоль
   - Регистрация, forgot-password, verify-email — мёртвые
   - Добавить fallback на Resend / Amazon SES / Mailgun + retry-логику

### 🟠 ВЫСОКИЙ ПРИОРИТЕТ

5. **Реклама — таймер вместо SDK**
   - AdMob / Yandex Ads SDK не интегрирован, стоит заглушка
   - Добавить `adUnitId` в `feature_flags` для смены без деплоя

6. **Sentry — не инициализирован**
   - `SENTRY_DSN` не вписан ни во фронт, ни в бэкенд
   - Ошибки в чатах и платежах уходят в никуда
   - Добавить `beforeSend` для фильтрации PII (пароли, токены)

7. **WebSocket — нет heartbeat/reconnect**
   - При обрыве связи (мобильный интернет) чат не восстанавливается
   - Добавить `pingInterval/pongTimeout` на сервере, `exponential backoff` на клиенте

8. **БД — нет миграций**
   - Схема живёт в `mysql_schema.sql`, колонки добавлялись ALTER TABLE вручную
   - Внедрить `umzug` / `node-pg-migrate` + `npm run migrate` в Dockerfile

9. **Загрузка файлов — нет ограничений**
   - `/api/upload` не проверяет `image/*`, `fileSize` и не сканирует
   - Хранилище на диске → перенести на S3 (Selectel / R2 / Yandex Object Storage)

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

12. **Docker — не production-ready**
    - Нет `.dockerignore` → в образ утекает `node_modules`, `.git`, `server/.env`
    - `docker-compose.yml`: нет `restart: unless-stopped`, `mem_limit`, именованного volume для MySQL

13. **Nginx — rate limiting и body size**
    - `limit_req_zone` на `/api/auth/login` и `/api/upload`
    - `client_max_body_size 5M;` для фото
    - `proxy_read_timeout` для WebSocket (сейчас 60s, мало)

14. **Логи — нет структурированного логирования**
    - `console.log` заменить на `winston` / `pino` с ротацией

### 🟢 НИЗКИЙ ПРИОРИТЕТ

15. **Кэширование**: Redis для сессий, кэша `compatibility_scores`, `feature_flags` (читаются из БД на каждый рендер)

16. **Бэкапы MySQL**: `mysqldump` cron или RDS automated backups

17. **CI/CD**: GitHub Actions для vitest + playwright на PR, сборки Docker + деплоя

### 📋 План по неделям

| Неделя | Задачи |
|--------|--------|
| Неделя 1 | Сменить dev-секреты (JWT, DB пароль). Починить 9 server-тестов. Добавить `/health` роут и запустить Playwright. Починить admin/stats, analytics, revenue |
| Неделя 2 | Stripe live + webhook. SMTP (Resend/SES). Sentry DSN + source maps. `noValidate` на оставшиеся формы |
| Неделя 3 | Миграции БД (umzug). Загрузка на S3 + валидация. Redis для сессий. Rate limiting |
| Неделя 4 | Docker: `.dockerignore`, `restart`, volumes. Nginx: rate limit, body size, WS timeouts. CI/CD (GitHub Actions). AdMob/Yandex SDK |

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
