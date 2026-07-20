import { rootLogger } from './logger.js'

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY
let fcmConfigured = false

export function isFCMConfigured() {
  return fcmConfigured
}

export async function sendFcmToUser(fcmToken, title, body, data = {}) {
  if (!FCM_SERVER_KEY) {
    rootLogger.info('[FCM MOCK] Would send to token', fcmToken?.slice(0, 10), title)
    return { success: true, mock: true }
  }
  try {
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: { title, body, sound: 'default' },
        data,
      }),
    })
    const result = await res.json()
    if (result.failure) {
      rootLogger.error('FCM send failed:', result)
      return { success: false, error: result.results?.[0]?.error }
    }
    return { success: true }
  } catch (err) {
    rootLogger.error('FCM send error:', err)
    return { success: false, error: err.message }
  }
}

export async function sendFcmToAll(fcmTokens, title, body, data = {}) {
  if (!FCM_SERVER_KEY) {
    rootLogger.info('[FCM MOCK] Would send to', fcmTokens?.length, 'tokens')
    return { success: true, mock: true }
  }
  const results = await Promise.allSettled(
    fcmTokens.map((token) => sendFcmToUser(token, title, body, data)),
  )
  const sent = results.filter((r) => r.status === 'fulfilled' && r.value.success).length
  return { success: sent > 0, sent }
}
fcmConfigured = !!FCM_SERVER_KEY
