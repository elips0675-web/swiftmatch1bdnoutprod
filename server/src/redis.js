import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL

let client = null

export function getRedis() {
  if (!REDIS_URL) return null
  if (client) return client

  client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null
      return Math.min(times * 200, 2000)
    },
    lazyConnect: true,
  })

  client.on('error', (err) => {
    console.error('[redis] error:', err.message)
  })

  return client
}

export async function withRedis(fn) {
  const r = getRedis()
  if (!r) return null
  try {
    return await fn(r)
  } catch (err) {
    console.error('[redis] operation failed:', err.message)
    return null
  }
}
