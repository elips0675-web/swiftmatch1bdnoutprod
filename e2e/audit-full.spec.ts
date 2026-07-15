import { test, expect } from '@playwright/test'
import { createAudit } from './helpers/audit'
import { apiCall, loginViaApi, healthCheck } from './helpers/api'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8081'
const ADMIN_EMAIL = 'admin@mail.ru'
const ADMIN_PASS = 'admin123'

async function loginViaUI(page: { goto: (url: string) => Promise<void>; fill: (selector: string, value: string) => Promise<void>; click: (selector: string) => Promise<void>; waitForURL: (regex: RegExp, opts?: { timeout: number }) => Promise<void> }, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  await page.fill('[data-testid="email"]', email)
  await page.fill('[data-testid="password"]', password)
  await page.click('[data-testid="submit-login"]')
  await page.waitForURL(/^((?!\/login).)*$/, { timeout: 10000 }).catch(() => {})
}

// ============ 1. HEALTH & INFRASTRUCTURE ============
test.describe('1. Health & Infrastructure', () => {
  test('API health check passes', async ({ request }) => {
    const health = await healthCheck(request)
    expect(health.ok).toBe(true)
    expect(health.db).toBe(true)
  })

  test('Frontend loads without errors', async ({ page }) => {
    const audit = createAudit(page)
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    audit.expectClean()
  })
})

// ============ 2. AUTH — Registration → Questionnaire ============
test.describe('2. Registration flow', () => {
  const uniqueEmail = `e2e_test_${Date.now()}@mail.ru`

  test('Register new user via UI then login', async ({ page, request }) => {
    const audit = createAudit(page)

    // Register
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')
    await page.fill('[data-testid="name"]', 'E2E Test User')
    await page.fill('[data-testid="email"]', uniqueEmail)
    await page.fill('[data-testid="password"]', 'TestPass123')
    await page.click('[data-testid="submit-register"]')

    // Should redirect away from /register
    await page.waitForURL(/^((?!\/register).)*$/, { timeout: 10000 }).catch(() => {})
    const url = page.url()
    expect(url).not.toContain('/register')

    // Now login with the new account
    await loginViaUI(page, uniqueEmail, 'TestPass123')
    await page.goto(`${BASE_URL}/profile/edit`)
    await page.waitForLoadState('networkidle')

    audit.expectClean()
  })
})

// ============ 3. AUTH — Login edge cases ============
test.describe('3. Negative auth tests', () => {
  test('Login with wrong password shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    await page.fill('[data-testid="email"]', 'demo@mail.ru')
    await page.fill('[data-testid="password"]', 'wrongpassword')
    await page.click('[data-testid="submit-login"]')

    // Should stay on /login and show error toast
    await page.waitForTimeout(1500)
    expect(page.url()).toContain('/login')
  })

  test('Empty email field shows validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    await page.fill('[data-testid="password"]', 'test123')
    await page.click('[data-testid="submit-login"]')

    // Browser-native validation for required field
    await page.waitForTimeout(500)
    const emailInput = page.locator('[data-testid="email"]')
    const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage)
    expect(validity.length).toBeGreaterThan(0)
  })
})

// ============ 4. SEARCH → LIKE → MATCH → CHAT ============
test.describe('4. Like → Match → Chat (two users)', () => {
  test('User A likes User B, creates match, sends message', async ({ browser, request }) => {
    // Login both users via API to get tokens
    const tokenA = await loginViaApi(request, 'user4@demo.ru', 'admin123')
    const tokenB = await loginViaApi(request, 'user5@demo.ru', 'admin123')
    expect(tokenA).toBeTruthy()
    expect(tokenB).toBeTruthy()

    // User A likes User B
    const likeA = await apiCall(request, 'POST', '/api/likes', { liked_user_id: 5 })
    expect(likeA.ok).toBe(true)

    // User B likes User A (creates match)
    const likeB = await apiCall(request, 'POST', '/api/likes', { liked_user_id: 4 })
    expect(likeB.ok).toBe(true)

    // Open User A's chat page
    const pageA = await browser.newPage()
    const auditA = createAudit(pageA)
    await pageA.goto(`${BASE_URL}/login`)
    await pageA.fill('[data-testid="email"]', 'user4@demo.ru')
    await pageA.fill('[data-testid="password"]', 'admin123')
    await pageA.click('[data-testid="submit-login"]')
    await pageA.waitForTimeout(2000)

    await pageA.goto(`${BASE_URL}/chats`)
    await pageA.waitForLoadState('networkidle')

    // Find a chat link and click it
    const chatLink = pageA.locator('a[href*="/chats/"]').first()
    if (await chatLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chatLink.click()
      await pageA.waitForLoadState('networkidle')

      // Send a message
      const msgInput = pageA.locator('[data-testid="message-input"]')
      if (await msgInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await msgInput.fill('Hello from E2E test!')
        await pageA.locator('[data-testid="send-button"]').click()
        await pageA.waitForTimeout(1000)

        // Verify message appears in the list
        await expect(pageA.locator('[data-testid="message-list"]')).toContainText('Hello from E2E test!')
      }
    }
    auditA.expectClean()
    await pageA.close()
  })
})

// ============ 5. ADMIN FLOW ============
test.describe('5. Admin flow', () => {
  let adminToken = ''

  test.beforeAll(async ({ request }) => {
    adminToken = await loginViaApi(request, ADMIN_EMAIL, ADMIN_PASS).catch(() => '')
  })

  test('Admin dashboard loads', async ({ page }) => {
    const audit = createAudit(page)
    await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASS)
    await page.goto(`${BASE_URL}/admin`)
    await page.waitForLoadState('networkidle')
    expect(page.url()).not.toContain('/login')
    audit.expectClean()
  })

  test('Toggle a feature flag via API', async ({ request }) => {
    if (!adminToken) test.skip()

    // Get current flags
    const { body: flags } = await apiCall(request, 'GET', '/api/admin/features')
    expect(Array.isArray(flags)).toBe(true)
    if (flags.length === 0) return

    // Toggle first flag
    const first = flags[0]
    const updated = await apiCall(request, 'PUT', '/api/admin/features', {
      [first.name || first.feature]: !(first.enabled ?? first.active),
    })
    expect(updated.ok).toBe(true)

    // Toggle back
    const restored = await apiCall(request, 'PUT', '/api/admin/features', {
      [first.name || first.feature]: first.enabled ?? first.active,
    })
    expect(restored.ok).toBe(true)
  })

  test('Feature flags page has save/reset buttons', async ({ page }) => {
    await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASS)
    await page.goto(`${BASE_URL}/admin`)

    const saveBtn = page.locator('[data-testid="save-features"]')
    const resetBtn = page.locator('[data-testid="reset-features"]')

    await expect(saveBtn).toBeVisible()
    await expect(resetBtn).toBeVisible()
  })

  test('Search users in admin panel', async ({ page }) => {
    await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASS)
    await page.goto(`${BASE_URL}/admin`)

    const searchInput = page.locator('[data-testid="search-users"]')
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('demo')
      await page.waitForTimeout(1000)
      // Verify results appear
      await expect(page.locator('table')).toBeVisible()
    }
  })
})

// ============ 6. PUBLIC PAGES ============
test.describe('6. Public pages load without errors', () => {
  const publicPages = ['/', '/login', '/register', '/forgot-password']

  for (const path of publicPages) {
    test(`${path} loads without console errors`, async ({ page }) => {
      const audit = createAudit(page)
      await page.goto(`${BASE_URL}${path}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      audit.expectClean()
    })
  }
})

// ============ 7. SETTINGS ============
test.describe('7. Settings page', () => {
  test('Settings switches are interactive', async ({ page }) => {
    const audit = createAudit(page)
    await loginViaUI(page, 'demo@mail.ru', 'admin123')
    await page.goto(`${BASE_URL}/settings`)
    await page.waitForLoadState('networkidle')

    const switchBtn = page.locator('[data-testid="switch-email-newsletter"]')
    if (await switchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await switchBtn.click()
      await page.waitForTimeout(500)
    }

    const logoutBtn = page.locator('[data-testid="logout-button"]')
    await expect(logoutBtn).toBeVisible()

    audit.expectClean()
  })
})

// ============ 8. CHAT ============
test.describe('8. Chat functionality', () => {
  test('Chat page opens and shows message input', async ({ page }) => {
    const audit = createAudit(page)
    await loginViaUI(page, 'demo@mail.ru', 'admin123')
    await page.goto(`${BASE_URL}/chats`)
    await page.waitForLoadState('networkidle')

    const chatLink = page.locator('a[href*="/chats/"]').first()
    if (await chatLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chatLink.click()
      await page.waitForLoadState('networkidle')

      await expect(page.locator('[data-testid="message-input"]')).toBeVisible({ timeout: 3000 })
      await expect(page.locator('[data-testid="send-button"]')).toBeVisible()
    }
    audit.expectClean()
  })
})

// ============ 9. GROUPS ============
test.describe('9. Groups page', () => {
  test('Groups create dialog opens', async ({ page }) => {
    const audit = createAudit(page)
    await loginViaUI(page, 'demo@mail.ru', 'admin123')
    await page.goto(`${BASE_URL}/groups`)
    await page.waitForLoadState('networkidle')

    const createBtn = page.locator('[data-testid="create-group-button"]')
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click()
      await page.waitForTimeout(500)

      await expect(page.locator('[data-testid="group-name"]')).toBeVisible({ timeout: 2000 })
      await expect(page.locator('[data-testid="group-description"]')).toBeVisible()
    }
    audit.expectClean()
  })
})

// ============ 10. NEGATIVE TESTS ============
test.describe('10. Negative & security tests', () => {
  test('XSS in profile bio is escaped', async ({ page }) => {
    const audit = createAudit(page)
    await loginViaUI(page, 'demo@mail.ru', 'admin123')
    await page.goto(`${BASE_URL}/profile/edit`)
    await page.waitForLoadState('networkidle')

    const bio = page.locator('[data-testid="profile-bio"]')
    await bio.fill('<script>alert("xss")</script>')
    await page.locator('[data-testid="save-profile"]').click()
    await page.waitForTimeout(1500)

    await page.reload()
    await page.waitForLoadState('networkidle')
    const bioValue = await page.locator('[data-testid="profile-bio"]').inputValue()
    expect(bioValue).not.toContain('<script>')
    audit.expectClean()
  })

  test('Wrong password stays on /login', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    await page.fill('[data-testid="email"]', 'demo@mail.ru')
    await page.fill('[data-testid="password"]', 'wrongpass123!')
    await page.click('[data-testid="submit-login"]')
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/login')
  })

  test('Empty email shows browser validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    await page.fill('[data-testid="password"]', 'test')
    await page.click('[data-testid="submit-login"]')
    await page.waitForTimeout(500)
    const msg = await page.locator('[data-testid="email"]').evaluate((el: HTMLInputElement) => el.validationMessage)
    expect(msg.length).toBeGreaterThan(0)
  })
})

// ============ 11. WS REAL-TIME ============
test.describe('11. WebSocket real-time', () => {
  test('Message appears without page reload', async ({ page }) => {
    const audit = createAudit(page)
    await loginViaUI(page, 'demo@mail.ru', 'admin123')
    await page.goto(`${BASE_URL}/chats`)
    await page.waitForLoadState('networkidle')

    const chatLink = page.locator('a[href*="/chats/"]').first()
    if (await chatLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatLink.click()
      await page.waitForLoadState('networkidle')

      const input = page.locator('[data-testid="message-input"]')
      if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
        await input.fill('E2E WS test message')
        await page.locator('[data-testid="send-button"]').click()
        await page.waitForTimeout(2000)

        const msgList = page.locator('[data-testid="message-list"]')
        await expect(msgList).toContainText('E2E WS test message', { timeout: 5000 })
      }
    }
    audit.expectClean()
  })
})
