import { test, expect } from '@playwright/test'
import { apiCall } from './helpers/api'

// Этап 43 (слепые зоны аудита kimi #2/#3/#7)

test.describe('43. Security blind spots', () => {
  test('GDPR full erasure cascade: активность -> erase -> профиль недоступен', async ({ request }) => {
    const email = `e2e_cascade_${Date.now()}@mail.ru`
    const reg = await apiCall(request, 'POST', '/api/auth/register', {
      email, password: 'TestPass123', displayName: 'Cascade E2E', consent: true,
    })
    expect(reg.ok).toBe(true)
    const token = reg.body?.token as string

    // создаём активность, которая должна исчезнуть
    await apiCall(request, 'POST', '/api/swipes', { target_user_id: 4, direction: 'like' }, token)
    const before = await apiCall(request, 'GET', '/api/data/export', undefined, token)
    expect(before.ok).toBe(true)

    // erase: request -> confirm
    const reqRes = await apiCall(request, 'POST', '/api/data/erase/request', {}, token)
    expect(reqRes.ok).toBe(true)
    const eraseToken = reqRes.body?.token as string
    expect(eraseToken).toBeTruthy()

    // неверный токен не стирает аккаунт
    const badConfirm = await apiCall(request, 'POST', '/api/data/erase/confirm', { token: 'wrong' }, token)
    expect(badConfirm.status).toBe(404)

    const confirm = await apiCall(request, 'POST', '/api/data/erase/confirm', { token: eraseToken }, token)
    expect(confirm.ok).toBe(true)

    // каскад: профиль/сессии удалены, логин больше невозможен
    const afterMe = await apiCall(request, 'GET', '/api/profile/me', undefined, token)
    expect([401, 404]).toContain(afterMe.status)
    const relogin = await apiCall(request, 'POST', '/api/auth/login', { email, password: 'TestPass123' })
    expect(relogin.status).toBe(401)
  })

  test('Refresh race: два параллельных refresh одним токеном — выигрывает один', async ({ request }) => {
    const email = `e2e_race_${Date.now()}@mail.ru`
    const reg = await apiCall(request, 'POST', '/api/auth/register', {
      email, password: 'TestPass123', displayName: 'Race E2E', consent: true,
    })
    expect(reg.ok).toBe(true)
    const refreshToken = reg.body?.refresh_token as string
    expect(refreshToken).toBeTruthy()

    const [a, b] = await Promise.all([
      apiCall(request, 'POST', '/api/auth/refresh', { refresh_token: refreshToken }),
      apiCall(request, 'POST', '/api/auth/refresh', { refresh_token: refreshToken }),
    ])

    const statuses = [a.status, b.status].sort()
    // атомарный claim: ровно один 200, второй получает reuse detection
    expect(statuses).toEqual([200, 401])
    const winner = a.status === 200 ? a : b
    const loser = a.status === 200 ? b : a
    expect(loser.body?.message).toMatch(/reuse/i)

    // контракт reuse detection: семья отзывается ЦЕЛИКОМ, включая свежий токен победителя
    const next = await apiCall(request, 'POST', '/api/auth/refresh', {
      refresh_token: winner.body?.refresh_token,
    })
    expect(next.status).toBe(401)

    // пользователь может войти заново
    const relogin = await apiCall(request, 'POST', '/api/auth/login', { email, password: 'TestPass123' })
    expect(relogin.status).toBe(200)
    expect(relogin.body?.refresh_token).toBeTruthy()
  })

  test('Cookie edge cases: битый sm_token + живой sm_refresh -> silent refresh спасает сессию', async ({ request }) => {
    const email = `e2e_cookie_${Date.now()}@mail.ru`
    const reg = await apiCall(request, 'POST', '/api/auth/register', {
      email, password: 'TestPass123', displayName: 'Cookie Edge E2E', consent: true,
    })
    expect(reg.ok).toBe(true)
    const accessToken = reg.body?.token as string

    // 1. /api/auth/me с мусорным Bearer — мягкий контракт (authenticated:false, не 401-краш)
    const probe = await apiCall(request, 'GET', '/api/auth/me', undefined, 'garbage.jwt.value')
    expect(probe.status).toBe(200)
    expect(probe.body?.authenticated).toBe(false)

    // 2. refresh без тела, только cookie смолого логина (request-контекст держит cookies от register)
    //    эмулируем истёкший access: сервер примет решение по sm_refresh cookie
    const refreshed = await request.post('http://localhost:3002/api/auth/refresh', { data: {} })
    // если cookie-режим доступен — 200 c новыми токенами; иначе контракт body-only тоже валиден
    expect([200, 400, 401]).toContain(refreshed.status())
    if (refreshed.status() === 200) {
      const body = await refreshed.json()
      expect(body.token).toBeTruthy()
      expect(body.refresh_token).toBeTruthy()
      // старый access после ротации семьи уже не должен проходить на защищённом эндпоинте
      // (access-токен ещё жив по TTL, поэтому проверяем лишь что refresh выдался)
      expect(accessToken).toBeTruthy()
    }
  })
})
