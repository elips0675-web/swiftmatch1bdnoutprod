import * as Sentry from '@sentry/node'

const SENTRY_DSN = process.env.SENTRY_DSN

export function initSentry(app) {
  if (!SENTRY_DSN) {
    console.log('[sentry] SENTRY_DSN not set, skipping')
    return false
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: `swiftmatch-server@${process.env.npm_package_version || '0.0.0'}`,
    beforeSend(event) {
      if (event.user) {
        delete event.user.email
        delete event.user.ip_address
        delete event.user.username
      }
      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
      }
      if (event.exception) {
        event.exception.values = event.exception.values?.map(v => ({
          ...v,
          value: v.value?.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[EMAIL]'),
        }))
      }
      return event
    },
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  })

  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.errorHandler())

  console.log('[sentry] initialized')
  return true
}
