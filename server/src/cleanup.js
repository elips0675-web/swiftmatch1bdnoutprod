// Этап 42 (аудит kimi 1.3): revoked refresh-токены нужны 30 дней для reuse-детекта,
// дальше их удаляем, чтобы таблица не разрасталась бесконечно
import pool from './db.js'
import { createLogger } from './logger.js'

const log = createLogger('cleanup')

export async function purgeRevokedRefreshTokens(db = pool) {
  const [result] = await db.query(
    'DELETE FROM refresh_tokens WHERE revoked = 1 AND created_at < NOW() - INTERVAL 30 DAY',
  )
  const affected = result?.affectedRows ?? 0
  if (affected > 0) log.info(`Purged ${affected} revoked refresh tokens`)
  return affected
}

export function startRefreshTokenCleanup(intervalMs = 24 * 60 * 60 * 1000) {
  const timer = setInterval(() => {
    purgeRevokedRefreshTokens().catch((err) => log.error('Refresh token cleanup failed: ' + err.message))
  }, intervalMs)
  timer.unref?.()
  return timer
}
