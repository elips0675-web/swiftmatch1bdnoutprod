// Account lockout (этап 34 по аудиту kimi): после N неудачных логинов подряд
// ключ (email) блокируется на 15 минут. In-memory — для single-instance pm2 достаточно.
const attempts = new Map()
const WINDOW_MS = 15 * 60 * 1000

function maxAttempts() {
  const n = parseInt(process.env.AUTH_LOCKOUT_MAX_ATTEMPTS, 10)
  return Number.isFinite(n) && n > 0 ? n : 5
}

export function isLocked(key) {
  const rec = attempts.get(key)
  if (!rec) return null
  if (!rec.lockedUntil) return null
  if (rec.lockedUntil > Date.now()) {
    return Math.max(1, Math.ceil((rec.lockedUntil - Date.now()) / 60000))
  }
  attempts.delete(key)
  return null
}

export function recordFailure(key) {
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

export function recordSuccess(key) {
  attempts.delete(key)
}

export function _resetLockout() {
  attempts.clear()
}
