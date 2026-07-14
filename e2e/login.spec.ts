import { test, expect } from '@playwright/test'

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('renders login form', async ({ page }) => {
    await expect(page.getByText('SwiftMatch')).toBeVisible()
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByText('Продолжить')).toBeVisible()
  })

  test('shows validation error on empty submit', async ({ page }) => {
    await page.getByText('Продолжить').click()
    await expect(page.locator('input:invalid')).toHaveCount(1)
  })

  test('navigates to register page', async ({ page }) => {
    await page.getByText('ЗАРЕГИСТРИРОВАТЬСЯ').click()
    await expect(page).toHaveURL('/register')
  })

  test('navigates to forgot password', async ({ page }) => {
    await page.getByText('Забыли пароль?').click()
    await expect(page).toHaveURL('/forgot-password')
  })

  test('toggles phone login tab', async ({ page }) => {
    await page.getByText('ТЕЛЕФОН').click()
    await expect(page.getByPlaceholder('+7 (999) 000-00-00')).toBeVisible()
  })
})
