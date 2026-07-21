import * as Sentry from '@sentry/react'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

export function initSentry() {
  if (!SENTRY_DSN) {
    if (import.meta.env.DEV) console.warn('[Sentry] DSN not configured, skipping initialization')
    return false
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    release: `swiftmatch@${import.meta.env.VITE_APP_VERSION || '0.0.0'}`,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })

  return true
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!SENTRY_DSN) return
  Sentry.captureException(error, { extra: context })
}

export function setSentryUser(userId: string | number, email?: string) {
  if (!SENTRY_DSN) return
  Sentry.setUser({ id: String(userId), email })
}

export function clearSentryUser() {
  if (!SENTRY_DSN) return
  Sentry.setUser(null)
}
