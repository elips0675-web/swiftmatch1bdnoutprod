import { APIRequestContext } from '@playwright/test'

const API_BASE = process.env.TEST_API_URL || 'http://localhost:3002'

export async function apiCall(request: APIRequestContext, method: string, endpoint: string, body?: Record<string, unknown>) {
  const res = await request.fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
  const json = await res.json().catch(() => null)
  return { status: res.status(), body: json, ok: res.ok() }
}

export async function loginViaApi(request: APIRequestContext, email: string, password: string) {
  const res = await apiCall(request, 'POST', '/api/auth/login', { email, password })
  if (res.ok && res.body?.token) {
    return res.body.token as string
  }
  throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`)
}

export async function healthCheck(request: APIRequestContext) {
  try {
    const res = await request.fetch(`${API_BASE}/health`)
    const body = await res.json()
    return { ok: res.status() === 200, db: body?.db === 'connected' }
  } catch {
    return { ok: false, db: false }
  }
}
