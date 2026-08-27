// Rate limiters (этап 40: вынесено из index.js для тестируемости)
// Этап 48: in-memory store (Redis недоступен локально, fallback дефолтный express-rate-limit)
import rateLimit from 'express-rate-limit'

// Фабрики — для тестов с изолированными счётчиками
export const makeAuthLimiter = () =>
  rateLimit({
    windowMs: 60_000,
    // 60 → 200 (этап: Е2Е-прогон 133 тестов с одного IP упирается в 60/мин
    // auth-запросов; lockout на 5 неудач остаётся главным анти-брутфорс-барьером)
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many auth attempts' },
  })

export const makeApiLimiter = () =>
  rateLimit({
    windowMs: 60_000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests' },
  })

export const makeLikeLimiter = () =>
  rateLimit({
    windowMs: 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many likes' },
  })

// Синглтоны для приложения
export const authLimiter = makeAuthLimiter()
export const apiLimiter = makeApiLimiter()
