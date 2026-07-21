# SwiftMatch — Project Context

## Stack

| Технология | Версия | Конфиг |
|---|---|---|
| React | 18 | Concurrent Features, hooks |
| Vite | 8 | ESM, HMR, proxy `/api→localhost:3002` |
| TypeScript | 5 | strict mode |
| Tailwind CSS | 3 | `tailwind.config.ts` + `tailwindcss-animate` |
| React Router | 6 | `react-router-dom` |
| TanStack Query | 5 | `@tanstack/react-query` |
| React Hook Form | 7 | + Zod 4 валидация |
| Framer Motion | 12 | анимации |
| Socket.IO | 4 | клиент + сервер |
| shadcn/ui | — | Radix primitives + кастомные стили |

## Design System

### Colors (HSL)
```css
--primary: 343 99% 62%;     /* #fe3c72 — розовый */
--primary-foreground: 355.7 100% 97.3%;
--secondary: 0 0% 96.1%;
--muted: 240 4.8% 95.9%;
--muted-foreground: 240 3.8% 46.1%;
--destructive: 0 84.2% 60.2%;
--border: 240 5.9% 90%;
--ring: 343 99% 62%;
--radius: 1.25rem;            /* 20px — скругления */
```

### Typography
- **Headlines**: Poppins, sans-serif (`font-headline`)
- **Body**: Quicksand, sans-serif (`font-body`)
- All weights: 400, 500, 600, 700, 800, 900

### CSS Utilities
- `cn()` — `clsx` + `tailwind-merge` (из `src/lib/utils.ts`)
- `.gradient-text` — градиентный текст `#fe3c72 → #ff8e53`
- `.gradient-bg` — градиентный фон `#fe3c72 → #ff8e53`
- `.app-shadow` — кастомная тень
- `.safe-pb` — padding с safe-area-inset-bottom
- `.no-scrollbar` — скрыть скроллбар

## Component Library (shadcn/ui)

Все компоненты в `src/components/ui/`:
`button`, `input`, `dialog`, `select`, `card`, `badge`, `avatar`, `toast`, `tabs`, `switch`, `popover`, `tooltip`, `dropdown-menu`, `scroll-area`, `sheet`, `table`, `form`, `label`, `radio-group`, `slider`, `checkbox`, `carousel`, `textarea`

Импорт: `import { Button } from "@/components/ui/button"`

### Component Pattern
```tsx
import { cn } from "@/lib/utils"
// Radix UI primitives
// Tailwind через cn()
// TypeScript с полной типизацией
```

## API Layer

- Базовый URL: `/api` (Vite proxy → `localhost:3002`)
- Auth: JWT Bearer в `Authorization` header
- Hook: `useApi()` из `src/hooks/use-api.ts` — обёртка над fetch
- React Query: `useQuery`, `useMutation` с автоматическим рефетчем

### Типы API
```ts
// src/types.ts — глобальные типы
// src/lib/constants.ts — константы (интересы, цели, знаки зодиака)
```

## i18n

- Кастомный `LanguageContext` (RU/EN)
- `useLanguage()` → `{ t, language, setLanguage }`
- `t(key)` — перевод по ключу
- Ключи в формате: `interest.sport`, `goal.serious_relationship`, `common.zodiac.leo`
- Все данные в БД хранятся как ключи переводов (не рус/англ текст)

## State Management

- **Серверное состояние**: TanStack Query (React Query v5)
- **Клиентское состояние**: React Context (custom `LanguageContext`, `FeatureFlagsProvider`)
- **Формы**: React Hook Form + Zod
- **Локальное**: `useState`, `useReducer`

## Routing

```tsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/search" element={<Search />} />
  <Route path="/matches" element={<Matches />} />
  <Route path="/chats" element={<Chats />} />
  <Route path="/chats/:chatId" element={<ChatById />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/profile/edit" element={<ProfileEdit />} />
  <Route path="/profile/:userId" element={<Profile />} />
  <Route path="/premium" element={<Premium />} />
  <Route path="/premium/success" element={<PremiumSuccess />} />
  <Route path="/premium/cancel" element={<PremiumCancel />} />
  <Route path="/admin/*" element={<Admin />} />
  <Route path="/groups" element={<Groups />} />
  <Route path="/groups/:category" element={<CategoryFeed />} />
  <Route path="/contest" element={<Contest />} />
  <Route path="/activity" element={<Activity />} />
  <Route path="/onboarding" element={<Onboarding />} />
  <Route path="/settings" element={<Settings />} />
  <Route path="/about" element={<About />} />
  <Route path="/faq" element={<Faq />} />
  <Route path="/support-chat" element={<SupportChat />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />
  <Route path="/verify-email" element={<VerifyEmail />} />
  <Route path="/schedule" element={<Schedule />} />
  <Route path="/profile/:userId/score" element={<ProfileScore />} />
</Routes>
```

## Project Structure

```
src/
├── components/
│   ├── ui/          # shadcn/ui компоненты
│   ├── dialogs/     # Модальные окна
│   └── shared/      # AdminGuard, AppHeader, BottomNav
├── context/         # React Contexts
├── hooks/           # Custom hooks (use-premium, use-websocket, use-toast)
├── lib/             # Утилиты, константы, env, native adapter
├── pages/           # Страницы (по одному файлу на роут)
├── types/           # TypeScript типы
├── main.tsx         # Entry point
├── App.tsx          # Router + Layout
└── vite-env.d.ts    # Vite env типы

server/
├── src/
│   ├── routes/      # Express роуты
│   │   └── admin/   # Админ API
│   ├── middleware/   # idempotency, auth
│   ├── index.js     # Server entry
│   ├── db.js        # MySQL pool
│   ├── mail.js      # SMTP
│   ├── ws.js        # Socket.IO
│   ├── logger.js    # Winston
│   ├── sentry.js    # Sentry init
│   └── redis.js     # ioredis client
```

## Vite Config Highlights

```ts
proxy: { '/api': { target: 'http://localhost:3002', changeOrigin: true } }
alias: { '@': path.resolve(__dirname, './src') }
build: { target: 'es2020', minify: 'esbuild', chunkSizeWarningLimit: 600 }
```

## Feature Flags

Загружаются из `GET /api/admin/features`:
`videoCalls`, `aiIcebreakers`, `aiCompatibility`, `groupsPage`, `contest`, `showAds`, `autosearch`

## Translation Keys

| Префикс | Пример | Файл |
|---|---|---|
| `interest.*` | `interest.sport` | `constants.ts` → `INTEREST_OPTIONS` |
| `goal.*` | `goal.serious_relationship` | `constants.ts` → `DATING_GOALS` |
| `common.zodiac.*` | `common.zodiac.leo` | `constants.ts` → `ZODIAC_SIGNS` |
| `education.*` | `education.higher` | `constants.ts` → `EDUCATION_OPTIONS` |
| `circadian.*` | `circadian.early_bird` | `constants.ts` → `CIRCADIAN_RHYTHM_OPTIONS` |
| `attach.*` | `attach.style.secure` | `attachment-styles.ts` |
| `chats.theme.*` | `chats.theme.romantic` | `chats.tsx` → `CHAT_THEMES` |
| `error.*` | `error.stripe.webhook_failed` | — |
| `premium.*` | `premium.status.active` | — |
| `ad.*` | `ad.profile_unlocked` | — |
| `auth.*` | `auth.email` | — |
| `button.*` | `button.watch` | — |
| `common.*` | `common.loading` | — |
| `register.*` | `register.name_placeholder` | — |
| `activity.*` | `activity.unlock_title` | — |
| `schedule.*` | `schedule.title` | — |
| `profile_score.*` | `profile_score.title` | — |
| `recommendation.*` | `recommendation.avatar` | — |
| `ttl.*` | `ttl.off_message` | — |

Переводы: RU — `language-context.tsx:12-931`, EN — `:935-1980`

## Premium Features (новые)

| Фича | Колонки | API | Premium gate |
|------|---------|-----|-------------|
| **Ghost Mode** (инкогнито) | `user_profiles.incognito` | `GET/PUT /api/settings/privacy` | Да (403 без подписки) |
| **Passport Mode** (другой город) | `passport_mode`, `passport_city`, `passport_lat`, `passport_lng` | `GET/PUT /api/settings/privacy` | Да (403 без подписки) |

## GDPR

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/data/export` | GET | Экспорт всех данных пользователя (JSON) |
| `/api/data/erase/request` | POST | Запрос на удаление (генерация токена) |
| `/api/data/erase/confirm` | POST | Подтверждение удаления по токену (24ч) |
| `/api/consent` | POST | Логирование согласия (тип + granted) |
| `/api/consent/history` | GET | История согласий |

Таблицы: `consent_log`, `data_erase_requests` — миграция `010_add_gdpr.sql`.
