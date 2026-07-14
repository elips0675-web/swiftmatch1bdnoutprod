import { test, expect } from '@playwright/test'

test.describe('Profile page', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login/)
  })
})
