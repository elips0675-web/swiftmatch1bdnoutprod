import * as Sentry from '@sentry/node'

const SENTRY_DSN = process.env.SENTRY_DSN

export function initSentry(app) {
  if (!SENTRY_DSN) return false

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: `swiftmatch-server@${process.env.npm_package_version || '0.0.0'}`,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  })

  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.errorHandler())

  return true
}
