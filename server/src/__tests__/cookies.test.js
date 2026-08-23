// Этап 42 (аудит kimi 1.2): __Host- префикс cookie в production
import { describe, it, expect, vi } from 'vitest'

// модуль читает NODE_ENV на import — динамически переимпортируем для каждого режима
async function importCookies(env) {
  vi.resetModules()
  const old = process.env.NODE_ENV
  process.env.NODE_ENV = env
  try {
    return await import('../cookies.js')
  } finally {
    process.env.NODE_ENV = old
  }
}

describe('cookie names (__Host- prefix)', () => {
  it('в dev — обычные имена', async () => {
    const c = await importCookies('development')
    expect(c.ACCESS_COOKIE).toBe('sm_token')
    expect(c.REFRESH_COOKIE).toBe('sm_refresh')
  })

  it('в production — __Host- префикс (защита от перезаписи с поддомена)', async () => {
    const c = await importCookies('production')
    expect(c.ACCESS_COOKIE).toBe('__Host-sm_token')
    expect(c.REFRESH_COOKIE).toBe('__Host-sm_refresh')
  })

  it('extractToken в production читает __Host-sm_token', async () => {
    const c = await importCookies('production')
    const req = { cookies: { '__Host-sm_token': 'jwt-x' } }
    expect(c.extractToken(req)).toBe('jwt-x')
    // Bearer приоритетнее
    expect(c.extractToken({ headers: { authorization: 'Bearer y' }, cookies: req.cookies })).toBe('y')
  })
})
