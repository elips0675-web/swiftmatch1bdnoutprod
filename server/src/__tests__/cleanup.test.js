// Этап 42 (аудит kimi 1.3): purge revoked refresh-токенов старше 30 дней
import { describe, it, expect, vi } from 'vitest'

vi.mock('../db.js', () => ({ default: { query: vi.fn() } }))
vi.mock('../logger.js', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
  rootLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { purgeRevokedRefreshTokens, startRefreshTokenCleanup } from '../cleanup.js'
import pool from '../db.js'

describe('purgeRevokedRefreshTokens', () => {
  it('удаляет только revoked-токены старше 30 дней и возвращает affectedRows', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 7 }, []])
    const n = await purgeRevokedRefreshTokens()
    expect(n).toBe(7)
    const sql = String(pool.query.mock.calls[0][0])
    expect(sql).toMatch(/DELETE FROM refresh_tokens/i)
    expect(sql).toMatch(/revoked = 1/)
    expect(sql).toMatch(/INTERVAL 30 DAY/)
    expect(sql).not.toMatch(/updated_at/)
  })

  it('когда удалять нечего — возвращает 0', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }, []])
    expect(await purgeRevokedRefreshTokens()).toBe(0)
  })

  it('startRefreshTokenCleanup ставит interval и unref не роняет процесс', () => {
    const t = startRefreshTokenCleanup(60_000)
    expect(typeof t.unref).toBe('function')
    clearInterval(t)
  })
})
