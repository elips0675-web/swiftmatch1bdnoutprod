// TOTP 2FA management (этап 38, аудит kimi: admin TOTP 2FA)
// Только админы через active-check adminAuth
import { Router } from 'express'
import pool from '../db.js'
import { rootLogger } from '../logger.js'
import { adminAuth } from '../middleware/adminAuth.js'
import { generateTotpSecret, verifyTotpToken } from '../totp.js'

const router = Router()

// Генерация секрета + otpauth URL для приложения-аутентификатора
router.post('/api/auth/2fa/setup', adminAuth, async (req, res) => {
  try {
    const { secret, otpauthUrl } = generateTotpSecret(req.admin.email || 'admin')
    await pool.query('UPDATE users SET totp_secret = ?, totp_enabled = 0 WHERE id = ?', [secret, req.admin.id])
    res.json({ otpauthUrl, secret })
  } catch (err) {
    rootLogger.error('2FA setup error: ' + err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Подтверждение кодом из аутентификатора -> включение 2FA
router.post('/api/auth/2fa/enable', adminAuth, async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim()
    if (!code) return res.status(400).json({ message: 'CODE_REQUIRED' })
    const [[row]] = await pool.query('SELECT totp_secret, totp_enabled FROM users WHERE id = ?', [req.admin.id])
    if (!row?.totp_secret) return res.status(400).json({ message: 'SETUP_REQUIRED' })
    if (row.totp_enabled === 1) return res.status(400).json({ message: 'ALREADY_ENABLED' })
    if (!verifyTotpToken(row.totp_secret, code)) return res.status(400).json({ message: 'TOTP_INVALID' })
    await pool.query('UPDATE users SET totp_enabled = 1 WHERE id = ?', [req.admin.id])
    res.json({ ok: true })
  } catch (err) {
    rootLogger.error('2FA enable error: ' + err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Выключение 2FA: требуется валидный текущий код
router.post('/api/auth/2fa/disable', adminAuth, async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim()
    if (!code) return res.status(400).json({ message: 'CODE_REQUIRED' })
    const [[row]] = await pool.query('SELECT totp_secret, totp_enabled FROM users WHERE id = ?', [req.admin.id])
    if (row?.totp_enabled !== 1) return res.status(400).json({ message: 'NOT_ENABLED' })
    if (!verifyTotpToken(row.totp_secret, code)) return res.status(400).json({ message: 'TOTP_INVALID' })
    await pool.query('UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?', [req.admin.id])
    res.json({ ok: true })
  } catch (err) {
    rootLogger.error('2FA disable error: ' + err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
