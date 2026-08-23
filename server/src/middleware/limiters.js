// Rate limiters (этап 40: вынесено из index.js для тестируемости)
import rateLimit from 'express-rate-limit'

// Фабрики — для тестов с изолированными счётчиками
export const makeAuthLimiter = () =>
  rateLimit({ windowMs: 60_000, max: 60, message: { message: 'Too many auth attempts' } })

export const makeApiLimiter = () =>
  rateLimit({ windowMs: 60_000, max: 600, message: { message: 'Too many requests' } })

// Синглтоны для приложения
export const authLimiter = makeAuthLimiter()
export const apiLimiter = makeApiLimiter()
