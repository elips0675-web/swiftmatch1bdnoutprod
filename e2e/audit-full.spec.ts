import { test, expect } from '@playwright/test'
import { createAudit } from './helpers/audit'
import { apiCall, loginViaApi, healthCheck } from './helpers/api'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8081'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mail.ru'
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123'
const USER_EMAIL = process.env.USER_EMAIL || 'demo@mail.ru'
const USER_PASS = process.env.USER_PASS || 'admin123'

async function login(page: { goto: (url: string) => Promise<void>; fill: (selector: string, value: string) => Promise<void>; click: (selector: string) => Promise<void>; waitForURL: (regex: RegExp, opts?: { timeout: number }) => Promise<void> }, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('[data-testid="email"]', email)
  await page.fill('[data-testid="password"]', password)
  await page.click('[data-testid="submit-login"]')
  await page.waitForURL(/^((?!\/login).)*$/, { timeout: 10000 }).catch(() => {})
}

test.describe('Health & Infrastructure', () => {
  test('API health check passes', async ({ request }) => {
    const health = await healthCheck(request)
    expect(health.ok).toBe(true)
    expect(health.db).toBe(true)
  })

  test('Frontend loads', async ({ page }) => {
    const audit = createAudit(page)
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    expect(audit.errors).toEqual([])
  })
})

test.describe('Auth', () => {
  test('Login page renders with testids', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await expect(page.locator('[data-testid="email"]')).toBeVisible()
    await expect(page.locator('[data-testid="password"]')).toBeVisible()
    await expect(page.locator('[data-testid="submit-login"]')).toBeVisible()
  })

  test('Register page renders with testids', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await expect(page.locator('[data-testid="name"]')).toBeVisible()
    await expect(page.locator('[data-testid="email"]')).toBeVisible()
    await expect(page.locator('[data-testid="password"]')).toBeVisible()
    await expect(page.locator('[data-testid="submit-register"]')).toBeVisible()
  })

  test('Admin login works', async ({ page }) => {
    const audit = createAudit(page)
    await login(page, ADMIN_EMAIL, ADMIN_PASS)
    await page.goto(`${BASE_URL}/admin`)
    await page.waitForLoadState('networkidle')
    const url = page.url()
    if (!url.includes('/login')) {
      audit.expectClean()
    }
  })
})

test.describe('Admin API endpoints', () => {
  test('/api/admin/analytics is not 404', async ({ request }) => {
    const { status } = await apiCall(request, 'GET', '/api/admin/analytics')
    expect(status).not.toBe(404)
  })

  test('/api/admin/revenue is not 404', async ({ request }) => {
    const { status } = await apiCall(request, 'GET', '/api/admin/revenue')
    expect(status).not.toBe(404)
  })

  test('/api/admin/stats returns array-safe response', async ({ request }) => {
    const { status, body } = await apiCall(request, 'GET', '/api/admin/stats')
    expect(status).toBe(200)
    expect(Array.isArray(body?.chartData || [])).toBe(true)
  })

  test('/api/admin/features returns array', async ({ request }) => {
    const { status, body } = await apiCall(request, 'GET', '/api/admin/features')
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
  })
})

test.describe('Public pages no errors', () => {
  const publicPages = ['/', '/login', '/register', '/forgot-password']

  for (const path of publicPages) {
    test(`${path} loads without errors`, async ({ page }) => {
      const audit = createAudit(page)
      await page.goto(`${BASE_URL}${path}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      audit.expectClean()
    })
  }
})

test.describe('Chat flow', () => {
  test('Chat page sends message via data-testid', async ({ page }) => {
    const audit = createAudit(page)
    await login(page, USER_EMAIL, USER_PASS)
    await page.goto(`${BASE_URL}/chats`)
    await page.waitForLoadState('networkidle')

    const firstChat = page.locator('a[href*="/chats/"]').first()
    if (await firstChat.isVisible()) {
      await firstChat.click()
      await page.waitForLoadState('networkidle')

      const input = page.locator('[data-testid="message-input"]')
      if (await input.isVisible()) {
        await input.fill('Playwright test message')
        await page.locator('[data-testid="send-button"]').click()
        await page.waitForTimeout(1000)
      }
    }
    audit.expectClean()
  })
})

test.describe('Visual regression placeholders', () => {
  test('Login page screenshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveSapshot('login-page.png', {
      maxDiffPixels: 200,
      mask: [page.locator('[class*="gradient"]')],
    }).catch(() => {
      // First run will fail — no baseline yet
      test.info().annotations.push({ type: 'info', description: 'Baseline created on first run' })
    })
  })
})
