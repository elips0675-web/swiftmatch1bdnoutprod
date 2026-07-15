import Redis from 'ioredis'
import logger from './logger.js'

const REDIS_URL = process.env.REDIS_URL

let client = null
let connected = false

export function getRedis() {
  if (!REDIS_URL) {
    if (!connected) {
      logger.info('Redis not configured — skipping')
      connected = true
    }
    return null
  }
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
    logger.error('[redis] connection error', err)
  })

  client.on('connect', () => {
    logger.info('[redis] connected')
  })

  client.on('close', () => {
    logger.info('[redis] connection closed')
  })

  return client
}

export async function withRedis(fn) {
  const r = getRedis()
  if (!r) return null
  try {
    return await fn(r)
  } catch (err) {
    logger.error('[redis] operation failed', err)
    return null
  }
}

export async function disconnectRedis() {
  if (client) {
    await client.quit()
    client = null
    connected = false
    logger.info('[redis] disconnected')
  }
}
