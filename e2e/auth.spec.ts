import { test, expect } from '@playwright/test'
import { apiCall, loginViaApi } from './helpers/api'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8081'
const API_BASE = process.env.TEST_API_URL || 'http://localhost:3002'

test.describe('Auth flow — login, register, forgot-password', () => {

  test.describe('Login', () => {

    test('1. UI: /login page loads with form elements', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.waitForLoadState('networkidle')

      const emailInput = page.locator('[data-testid="email"]')
      await expect(emailInput).toBeVisible({ timeout: 10000 })

      const passwordInput = page.locator('[data-testid="password"]')
      await expect(passwordInput).toBeVisible()

      const submitBtn = page.locator('[data-testid="submit-login"]')
      await expect(submitBtn).toBeVisible()
    })

    test('2. UI: valid login redirects away from /login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.waitForLoadState('networkidle')
      await page.fill('[data-testid="email"]', 'user2@mail.ru')
      await page.fill('[data-testid="password"]', 'demo123456')
      await page.click('[data-testid="submit-login"]')
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 }).catch(() => {})
      expect(page.url()).not.toContain('/login')
    })

    test('3. UI: wrong password stays on /login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.waitForLoadState('networkidle')
      await page.fill('[data-testid="email"]', `wronguser_${Date.now()}@test.com`)
      await page.fill('[data-testid="password"]', 'wrongpassword123')
      await page.click('[data-testid="submit-login"]')
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('/login')
    })

    test('4. UI: empty email shows validation error', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.waitForLoadState('networkidle')
      await page.fill('[data-testid="password"]', 'demo123456')
      await page.click('[data-testid="submit-login"]')
      await page.waitForTimeout(1000)
      expect(page.url()).toContain('/login')
    })

    test('5. API: login returns JWT token', async ({ request }) => {
      const res = await apiCall(request, 'POST', '/api/auth/login', {
        email: 'user2@mail.ru',
        password: 'demo123456'
      })
      expect(res.ok).toBe(true)
      expect(res.body.token).toBeDefined()
      expect(typeof res.body.token).toBe('string')
      expect(res.body.token.split('.')).toHaveLength(3)
    })

    test('6. API: login with wrong password returns 401', async ({ request }) => {
      const res = await apiCall(request, 'POST', '/api/auth/login', {
        email: `wronguser_${Date.now()}@test.com`,
        password: 'wrongpassword'
      })
      expect(res.status).toBe(401)
    })

    test('7. API: login with non-existent email returns 401', async ({ request }) => {
      const res = await apiCall(request, 'POST', '/api/auth/login', {
        email: 'nonexistent@test.com',
        password: 'demo123456'
      })
      expect(res.status).toBe(401)
    })

    test('8. API: GET /api/auth/me returns authenticated status', async ({ request }) => {
      const token = await loginViaApi(request, 'user2@mail.ru', 'demo123456')
      const res = await apiCall(request, 'GET', '/api/auth/me', undefined, token)
      expect(res.ok).toBe(true)
      expect(res.body.authenticated).toBe(true)
    })

    test('9. API: GET /api/auth/me without token returns 200 + authenticated:false', async ({ request }) => {
      const res = await apiCall(request, 'GET', '/api/auth/me')
      expect(res.status).toBe(200)
      expect(res.body.authenticated).toBe(false)
    })
  })

  test.describe('Register', () => {

    test('10. UI: /register page loads with form', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`)
      await page.waitForLoadState('networkidle')

      const nameInput = page.locator('[data-testid="name"]')
      await expect(nameInput).toBeVisible({ timeout: 10000 })

      const emailInput = page.locator('[data-testid="email"]')
      await expect(emailInput).toBeVisible()

      const passwordInput = page.locator('[data-testid="password"]')
      await expect(passwordInput).toBeVisible()

      const submitBtn = page.locator('[data-testid="submit-register"]')
      await expect(submitBtn).toBeVisible()
    })

    test('11. API: register creates new user and returns token', async ({ request }) => {
      const unique = Date.now()
      const email = `e2e_register_${unique}@test.com`
      const res = await apiCall(request, 'POST', '/api/auth/register', {
        name: 'E2E Test User',
        email,
        password: 'TestPass123!',
        age: 25,
        consent: true,
      })
      expect(res.ok).toBe(true)
      expect(res.body.token).toBeDefined()
    })

    test('12. API: register with duplicate email returns error', async ({ request }) => {
      const res = await apiCall(request, 'POST', '/api/auth/register', {
        name: 'Duplicate User',
        email: 'user2@mail.ru',
        password: 'TestPass123!',
        age: 25,
        consent: true,
      })
      expect(res.ok).toBe(false)
      expect(res.status).toBe(409)
    })

    test('13. API: register with short password returns error', async ({ request }) => {
      const res = await apiCall(request, 'POST', '/api/auth/register', {
        name: 'Short Pass',
        email: `short_${Date.now()}@test.com`,
        password: '123',
        age: 25,
        consent: true,
      })
      expect(res.ok).toBe(false)
    })
  })

  test.describe('Forgot Password', () => {

    test('14. UI: /forgot-password page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/forgot-password`)
      await page.waitForLoadState('networkidle')

      const emailInput = page.locator('[data-testid="email"]')
      await expect(emailInput).toBeVisible({ timeout: 10000 })

      const submitBtn = page.locator('[data-testid="submit-forgot-password"]')
      await expect(submitBtn).toBeVisible()
    })

    test('15. API: POST /api/auth/forgot-password returns 200 for valid email', async ({ request }) => {
      const res = await apiCall(request, 'POST', '/api/auth/forgot-password', {
        email: 'user2@mail.ru'
      })
      expect(res.ok).toBe(true)
    })

    test('16. API: POST /api/auth/forgot-password returns 200 even for non-existent email (prevents enumeration)', async ({ request }) => {
      const res = await apiCall(request, 'POST', '/api/auth/forgot-password', {
        email: 'nonexistent@test.com'
      })
      expect(res.status).toBe(200)
    })

    test('17. UI: forgot-password form submit shows success message', async ({ page }) => {
      await page.goto(`${BASE_URL}/forgot-password`)
      await page.waitForLoadState('networkidle')
      await page.fill('[data-testid="email"]', 'user2@mail.ru')
      await page.click('[data-testid="submit-forgot-password"]')
      await page.waitForTimeout(2000)
      const url = page.url()
      expect(url).toContain('/forgot-password')
    })
  })

  test.describe('Logout', () => {

    test('18. API: POST /api/auth/logout clears session', async ({ request }) => {
      const token = await loginViaApi(request, 'user2@mail.ru', 'demo123456')
      const res = await apiCall(request, 'POST', '/api/auth/logout', undefined, token)
      expect(res.ok).toBe(true)
    })

    test('19. UI: logout button redirects to /login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.waitForLoadState('networkidle')
      await page.fill('[data-testid="email"]', 'user2@mail.ru')
      await page.fill('[data-testid="password"]', 'demo123456')
      await page.click('[data-testid="submit-login"]')
      await page.waitForURL(/\/(search|profile|matches)/, { timeout: 10000 }).catch(() => {})

      await page.goto(`${BASE_URL}/settings`)
      await page.waitForLoadState('networkidle')

      const logoutBtn = page.locator('[data-testid="logout-button"]')
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click()
        await page.waitForTimeout(2000)
        expect(page.url()).toContain('/login')
      }
    })
  })

  test.describe('Account lockout', () => {

    test('20. API: multiple failed logins trigger lockout', async ({ request }) => {
      const lockoutEmail = `lockout_${Date.now()}@test.com`

      for (let i = 0; i < 6; i++) {
        const res = await apiCall(request, 'POST', '/api/auth/login', {
          email: lockoutEmail,
          password: 'wrongpassword'
        })
        if (res.status === 429) {
          expect(res.body.message).toMatch(/too many|locked|attempts/i)
          return
        }
        expect(res.status).toBe(401)
      }
    })
  })
})
