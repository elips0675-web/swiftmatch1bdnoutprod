// Circuit Breaker для внешних API (аудит дипсик: нет таймаутов и retry с backoff)
// При падении внешнего сервиса запросы fail-fast вместо зависания на 24 сек.
import CircuitBreaker from 'opossum'
import { rootLogger } from './logger.js'

const defaultOptions = {
  timeout: 10_000,
  errorThresholdPercentage: 50,
  resetTimeout: 30_000,
  volumeThreshold: 5,
}

function createBreaker(fn, name, opts = {}) {
  const breaker = new CircuitBreaker(fn, { ...defaultOptions, ...opts })

  breaker.on('open', () => {
    rootLogger.warn(`[circuit-breaker] ${name} — OPEN (failing fast)`)
  })

  breaker.on('halfOpen', () => {
    rootLogger.info(`[circuit-breaker] ${name} — HALF-OPEN (testing recovery)`)
  })

  breaker.on('close', () => {
    rootLogger.info(`[circuit-breaker] ${name} — CLOSED (recovered)`)
  })

  breaker.on('fallback', () => {
    rootLogger.warn(`[circuit-breaker] ${name} — fallback invoked`)
  })

  return breaker
}

export const stripeBreaker = createBreaker(
  async (...args) => {
    const mod = await import('stripe')
    const stripe = new mod.default(process.env.STRIPE_SECRET_KEY)
    return stripe.checkout.sessions.create(...args)
  },
  'stripe-checkout',
  { timeout: 15_000 },
)

export function wrapExternalCall(fn, name, opts) {
  return createBreaker(fn, name, opts).fire.bind(createBreaker(fn, name, opts))
}

export default { stripeBreaker, createBreaker, wrapExternalCall }
