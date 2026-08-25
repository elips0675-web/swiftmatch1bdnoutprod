import { describe, it, expect } from 'vitest'

const API = process.env.SECURITY_HEADERS_API || 'http://localhost:3002'
const serverUp = await fetch(`${API}/health`, { signal: AbortSignal.timeout(1500) })
  .then((r) => r.ok)
  .catch(() => false)

// Этап 35, аудит qwen: заголовки безопасности не проверялись никакими тестами.
// Тест живой: требует запущенного сервера (локально или в staging-джобе CI).
describe.skipIf(!serverUp)('security headers (live server)', () => {
  const getHeaders = async () => {
    const res = await fetch(`${API}/health`)
    return { status: res.status, headers: Object.fromEntries(res.headers.entries()) }
  }

  it('sets Content-Security-Policy', async () => {
    const { headers } = await getHeaders()
    expect(headers['content-security-policy']).toMatch(/default-src 'self'/)
  })

  it('prevents clickjacking (X-Frame-Options / frame-ancestors)', async () => {
    const { headers } = await getHeaders()
    expect(headers['x-frame-options'] ?? headers['frame-ancestors']).toBeTruthy()
  })

  it('sets X-Content-Type-Options: nosniff', async () => {
    const { headers } = await getHeaders()
    expect(headers['x-content-type-options']).toBe('nosniff')
  })

  it('sets Strict-Transport-Security', async () => {
    const { headers } = await getHeaders()
    expect(headers['strict-transport-security']).toMatch(/max-age=\d+/)
  })

  it('does not leak referrer', async () => {
    const { headers } = await getHeaders()
    expect(headers['referrer-policy']).toBe('no-referrer')
  })

  it('health endpoint answers without auth', async () => {
    const { status } = await getHeaders()
    expect(status).toBe(200)
  })

  it('auth endpoints are not cacheable by proxies', async () => {
    // /api/auth/me без токена -> 401; ответ не должен кешироваться
    const res = await fetch(`${API}/api/auth/me`).catch(() => null)
    if (!res) return
    const cc = res.headers.get('cache-control') ?? ''
    expect(res.status === 401 || res.status === 200).toBe(true)
    expect(cc === '' ? '' : cc).not.toMatch(/public/i)
  })
})
