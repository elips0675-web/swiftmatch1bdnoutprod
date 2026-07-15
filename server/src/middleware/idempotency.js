const idempotentStore = new Map()

const ONE_HOUR = 3600 * 1000

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of idempotentStore) {
    if (now - entry.ts > ONE_HOUR) idempotentStore.delete(key)
  }
}, 60_000)

export function idempotency(req, res, next) {
  const key = req.headers['idempotency-key']
  if (!key) return next()

  const existing = idempotentStore.get(key)
  if (existing) {
    return res.status(existing.status).json(existing.body)
  }

  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 500) {
      idempotentStore.set(key, { status: res.statusCode, body: res.body, ts: Date.now() })
    }
  })

  next()
}
