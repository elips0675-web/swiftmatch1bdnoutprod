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

## Плановые хвосты (не блокируют)

- Внешние блокеры (не код): staging VPS + docker compose up, реальные ключи в `.env`, домен + SSL + Google Play, k6 100 VU на staging, UptimeRobot/Grafana-алерты.
- Код/низкий приоритет (после релиза): CSRF double-submit (при выносе API на поддомен), fingerprint refresh, SMS (Twilio), AI-модерация фото (Rekognition), CDN/S3.
- Открыт: сверка поведения jsdom/localStorage на Node 25 dev vs 22-alpine Docker.
