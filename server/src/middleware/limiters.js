// Rate limiters (этап 40: вынесено из index.js для тестируемости)
// Этап 48 (аудит kimi 1.1): Redis store для multi-instance (Docker Compose / PM2 cluster)
import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { getRedis } from '../redis.js'
import { rootLogger } from '../logger.js'

function redisStoreFactory(prefix) {
  const client = getRedis()
  if (!client) return undefined
  rootLogger.info(`[limiters] Using Redis store for ${prefix}`)
  return new RedisStore({
    sendCommand: (...args) => client.call(...args),
    prefix: 'rl:' + prefix + ':',
  })
}

// Фабрики — для тестов с изолированными счётчиками
export const makeAuthLimiter = () =>
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStoreFactory('auth'),
    message: { message: 'Too many auth attempts' },
  })

export const makeApiLimiter = () =>
  rateLimit({
    windowMs: 60_000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStoreFactory('api'),
    message: { message: 'Too many requests' },
  })

// Синглтоны для приложения
export const authLimiter = makeAuthLimiter()
export const apiLimiter = makeApiLimiter()
