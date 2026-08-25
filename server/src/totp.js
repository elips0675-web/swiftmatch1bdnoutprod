// TOTP 2FA для админов (этап 38, аудит kimi: admin TOTP 2FA)
// oplib v13 API: generateSecret/generateURI/verifySync
import { generateSecret, generateURI, verifySync } from 'otplib'

export function generateTotpSecret(email) {
  const secret = generateSecret()
  const otpauthUrl = generateURI({ secret, issuer: 'SwiftMatch Admin', label: String(email) })
  return { secret, otpauthUrl }
}

export function verifyTotpToken(secret, token) {
  try {
    if (!secret || !token || !/^\d{6}$/.test(String(token).trim())) return false
    // epochTolerance=30: допускаем соседний 30-секундный слот (дрейф часов телефона)
    const res = verifySync({ token: String(token).trim(), secret, epochTolerance: 30 })
    return Boolean(res && res.valid)
  } catch {
    return false
  }
}
