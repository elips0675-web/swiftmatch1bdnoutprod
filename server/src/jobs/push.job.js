import webpush from 'web-push'
import pool from '../db.js'
import { rootLogger } from '../logger.js'

const vapidPublic = process.env.VAPID_PUBLIC_KEY || ''
const vapidPrivate = process.env.VAPID_PRIVATE_KEY || ''

if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails('mailto:admin@swiftmatch.app', vapidPublic, vapidPrivate)
}

export default async function processPush(job) {
  const { userId, title, body, url, userIds } = job.data

  if (!vapidPublic || !vapidPrivate) {
    rootLogger.info('[push-job] VAPID not configured — push skipped')
    return { skipped: true }
  }

  try {
    let rows

    if (userIds && userIds.length > 0) {
      [rows] = await pool.query(
        'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id IN (?)',
        [userIds],
      )
    } else if (userId) {
      [rows] = await pool.query(
        'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
        [userId],
      )
    } else {
      [rows] = await pool.query(
        'SELECT endpoint, p256dh, auth FROM push_subscriptions',
      )
    }

    let sent = 0
    for (const sub of rows) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body, url: url || '/', icon: '/icon-192x192.png' }),
        )
        sent++
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await pool.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint])
        }
      }
    }

    rootLogger.info(`[push-job] Sent ${sent} push notifications`)
    return { sent }
  } catch (err) {
    rootLogger.error('[push-job] Error:', err)
    throw err
  }
}
