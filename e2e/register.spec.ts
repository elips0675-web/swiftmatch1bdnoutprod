import { test, expect } from '@playwright/test'

test.describe('Register page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('renders registration form', async ({ page }) => {
    await expect(page.getByText('SwiftMatch')).toBeVisible()
    await expect(page.getByPlaceholder('Имя')).toBeVisible()
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByText('СОЗДАТЬ АККАУНТ')).toBeVisible()
  })

  test('navigates to login page', async ({ page }) => {
    await page.getByText('ВОЙТИ').click()
    await expect(page).toHaveURL('/login')
  })
})
