import Redis from 'ioredis'
import logger from './logger.js'

const REDIS_URL = process.env.REDIS_URL

let client = null
let pubClient = null
let subClient = null
let connected = false

function createRedisClient() {
  if (!REDIS_URL) return null
  return new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null
      return Math.min(times * 200, 2000)
    },
    lazyConnect: true,
  })
}

function attachListeners(redisClient, label) {
  redisClient.on('error', (err) => {
    logger.error(`[redis] ${label} connection error`, err)
  })
  redisClient.on('connect', () => {
    logger.info(`[redis] ${label} connected`)
  })
  redisClient.on('close', () => {
    logger.info(`[redis] ${label} connection closed`)
  })
}

export function getRedis() {
  if (!REDIS_URL) {
    if (!connected) {
      logger.info('Redis not configured — skipping')
      connected = true
    }
    return null
  }
  if (client) return client

  client = createRedisClient()
  attachListeners(client, 'client')
  return client
}

export function getRedisPub() {
  if (!REDIS_URL) return null
  if (pubClient) return pubClient
  pubClient = createRedisClient()
  attachListeners(pubClient, 'pub')
  return pubClient
}

export function getRedisSub() {
  if (!REDIS_URL) return null
  if (subClient) return subClient
  subClient = createRedisClient()
  attachListeners(subClient, 'sub')
  return subClient
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
  for (const [label, c] of [['client', client], ['pub', pubClient], ['sub', subClient]]) {
    if (c) {
      await c.quit().catch(() => {})
      logger.info(`[redis] ${label} disconnected`)
    }
  }
  client = null
  pubClient = null
  subClient = null
  connected = false
}
