// Account lockout (этап 34 по аудиту kimi): после N неудачных логинов подряд
// ключ (email) блокируется на 15 минут.
// Этап 48 (аудит kimi 1.1): Redis-backed для multi-instance.
// Fallback: in-memory Map если Redis недоступен.
import { getRedis } from './redis.js'
import { rootLogger } from './logger.js'

const WINDOW_MS = 15 * 60 * 1000
const WINDOW_SEC = Math.floor(WINDOW_MS / 1000)

// In-memory fallback
const attempts = new Map()

function maxAttempts() {
  const n = parseInt(process.env.AUTH_LOCKOUT_MAX_ATTEMPTS, 10)
  return Number.isFinite(n) && n > 0 ? n : 5
}

async function redisLockout(key) {
  const r = getRedis()
  if (!r) return null
  try {
    const locked = await r.get('lockout:' + key)
    if (locked) {
      const ttl = await r.ttl('lockout:' + key)
      return Math.max(1, Math.ceil(ttl / 60))
    }
    return null
  } catch {
    return null
  }
}

async function redisRecordFailure(key) {
  const r = getRedis()
  if (!r) {
    memoryRecordFailure(key)
    return
  }
  try {
    const k = 'lockout:attempts:' + key
    const count = await r.incr(k)
    if (count === 1) {
      await r.expire(k, WINDOW_SEC)
    }
    if (count >= maxAttempts()) {
      await r.set('lockout:' + key, '1', 'EX', WINDOW_SEC)
      rootLogger.warn(`[lockout] Redis: locked ${key} for ${WINDOW_SEC}s after ${count} failures`)
    }
  } catch {
    memoryRecordFailure(key)
  }
}

async function redisRecordSuccess(key) {
  const r = getRedis()
  if (!r) {
    attempts.delete(key)
    return
  }
  try {
    await r.del('lockout:attempts:' + key)
    await r.del('lockout:' + key)
  } catch {
    attempts.delete(key)
  }
}

// In-memory fallback (same logic as before)
function memoryRecordFailure(key) {
  const now = Date.now()
  let rec = attempts.get(key)
  if (!rec || now - rec.firstAt > WINDOW_MS) {
    rec = { count: 0, firstAt: now }
    attempts.set(key, rec)
    if (attempts.size > 10000) {
      for (const [k, v] of attempts) {
        if (now - v.firstAt > WINDOW_MS) attempts.delete(k)
      }
    }
  }
  rec.count += 1
  if (rec.count >= maxAttempts()) {
    rec.lockedUntil = now + WINDOW_MS
    rec.count = 0
  }
}

function memoryIsLocked(key) {
  const rec = attempts.get(key)
  if (!rec || !rec.lockedUntil) return null
  if (rec.lockedUntil > Date.now()) {
    return Math.max(1, Math.ceil((rec.lockedUntil - Date.now()) / 60000))
  }
  attempts.delete(key)
  return null
}

export async function isLocked(key) {
  const r = getRedis()
  if (r) return await redisLockout(key)
  return memoryIsLocked(key)
}

export async function recordFailure(key) {
  await redisRecordFailure(key)
}

export async function recordSuccess(key) {
  await redisRecordSuccess(key)
}

export function _resetLockout() {
  attempts.clear()
}
