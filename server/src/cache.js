import { withRedis } from './redis.js'

const CACHE_TTL = Number(process.env.CACHE_TTL) || 60

export function cacheKey(prefix, id) {
  return `swiftmatch:${prefix}:${id}`
}

export async function getCached(key) {
  return withRedis(async (r) => {
    const raw = await r.get(key)
    if (!raw) return null
    return JSON.parse(raw)
  })
}

export async function setCached(key, data, ttl = CACHE_TTL) {
  return withRedis(async (r) => {
    await r.setex(key, ttl, JSON.stringify(data))
  })
}

export async function invalidate(pattern) {
  return withRedis(async (r) => {
    const stream = r.scanStream({ match: `swiftmatch:${pattern}`, count: 100 })
    for await (const keys of stream) {
      if (keys.length) await r.del(...keys)
    }
  })
}

export function cacheRoute(ttl = CACHE_TTL) {
  return (req, res, next) => {
    const key = cacheKey('route', req.originalUrl)
    getCached(key).then((cached) => {
      if (cached) return res.json(cached)
      const originalJson = res.json.bind(res)
      res.json = (body) => {
        setCached(key, body, ttl).catch(() => {})
        originalJson(body)
      }
      next()
    }).catch(() => next())
  }
}

export function cacheRoutePerUser(ttl = CACHE_TTL) {
  return (req, res, next) => {
    if (!req.userId) return next()
    const key = cacheKey('user', `${req.userId}:${req.originalUrl}`)
    getCached(key).then((cached) => {
      if (cached) return res.json(cached)
      const originalJson = res.json.bind(res)
      res.json = (body) => {
        setCached(key, body, ttl).catch(() => {})
        originalJson(body)
      }
      next()
    }).catch(() => next())
  }
}
