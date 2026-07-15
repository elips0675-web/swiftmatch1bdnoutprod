import { expect, Page, TestInfo } from '@playwright/test'

export interface AuditResult {
  errors: string[]
  warnings: string[]
}

export function createAudit(page: Page, testInfo?: TestInfo) {
  const errors: string[] = []
  const warnings: string[] = []

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text()
      if (!text.includes('Sentry') && !text.includes('Supabase') && !text.includes('Service Worker') && !text.includes('non-existent route')) {
        errors.push(`Console: ${text.substring(0, 200)}`)
      }
    }
    if (msg.type() === 'warning') {
      warnings.push(`Console: ${msg.text().substring(0, 200)}`)
    }
  })

  page.on('response', res => {
    if (res.status() >= 500) {
      errors.push(`API ${res.status()}: ${res.url().substring(0, 150)}`)
    }
    if (res.status() === 429) {
      warnings.push(`Rate limited (429): ${res.url().substring(0, 150)}`)
    }
    if (res.status() === 0) {
      errors.push(`Network failed: ${res.url().substring(0, 150)}`)
    }
  })

  page.on('pageerror', err => {
    errors.push(`PageError: ${err.message.substring(0, 200)}`)
  })

  return {
    errors,
    warnings,
    expectClean: () => {
      if (errors.length > 0) {
        console.log(`Audit found ${errors.length} errors:`, errors)
      }
      expect(errors).toEqual([])
    },
    attachToTest: async () => {
      if (testInfo && errors.length > 0) {
        await testInfo.attach('audit-errors', {
          body: errors.join('\n'),
          contentType: 'text/plain',
        })
      }
    },
  }
}
