vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-secret'
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBreaker, stripeBreaker, wrapExternalCall } from '../circuit-breaker.js'

vi.mock('../logger.js', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  rootLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

describe('circuit-breaker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('должен возвращать успешный результат вызова', async () => {
    const breaker = createBreaker(async (v) => v * 2, 'test-ok')
    await expect(breaker.fire(21)).resolves.toBe(42)
  })

  it('должен иметь метод fire()', async () => {
    const breaker = createBreaker(async () => 'value', 'test-fire')
    expect(typeof breaker.fire).toBe('function')
    await expect(breaker.fire()).resolves.toBe('value')
  })

  it('должен пробрасывать ошибку сервиса через fire()', async () => {
    const breaker = createBreaker(async () => {
      throw new Error('upstream down')
    }, 'test-fail')
    await expect(breaker.fire()).rejects.toThrow('upstream down')
  })

  it('stripeBreaker должен быть создан и иметь fire()', () => {
    expect(typeof stripeBreaker.fire).toBe('function')
  })

  it('wrapExternalCall возвращает обёрнутую fire-функцию', async () => {
    const wrapped = wrapExternalCall(async (x) => x + 1, 'test-wrap')
    await expect(wrapped(1)).resolves.toBe(2)
  })
})
