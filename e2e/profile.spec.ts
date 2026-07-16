import { test, expect } from '@playwright/test'

test.describe('Profile page', () => {
  test('loads without auth redirect', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/profile')
  })
})
