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

## Что ещё можно сделать

| # | Задача | Приоритет |
|---|--------|-----------|
| 1 | **Stripe live** — вписать `STRIPE_SECRET_KEY` в `.env` (код готов) | Высокий |
| 2 | **Реальная реклама** — AdMob / Yandex SDK (showAds флаг починен, админка загружает конфиг) | Высокий |
| 3 | **SMTP** — вписать SMTP_USER/PASS в `.env` (хосты раскомментированы) | Низкий |
| 4 | **Server tests** — 9 pre-existing failures (admin:7, profile:1, social:1), нужно чинить моки | Средний |
| 5 | **E2E tests** — Playwright настроен, требует запущенного сервера для прогона | Низкий |
| 6 | **Sentry DSN** — вписать `SENTRY_DSN` в `.env.example` и `server/.env` | Низкий |

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
