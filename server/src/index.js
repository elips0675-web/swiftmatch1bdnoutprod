import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import pool from './db.js'
import { initIO, startMessageCleanup } from './ws.js'
import { createLogger, rootLogger } from './logger.js'
import { idempotency } from './middleware/idempotency.js'
import { initSentry } from './sentry.js'
import { getRedis, disconnectRedis } from './redis.js'

import adminDashboard from './routes/admin/dashboard.js'
import adminUsers from './routes/admin/users.js'
import adminAnalytics from './routes/admin/analytics.js'
import adminReports from './routes/admin/reports.js'
import adminContent from './routes/admin/content.js'
import adminFeatures from './routes/admin/features.js'
import adminMessaging from './routes/admin/messaging.js'
import adminMonetization from './routes/admin/monetization.js'
import profileRoutes from './routes/profile.js'
import uploadRoutes from './routes/upload.js'
import pushRoutes from './routes/push.js'
import socialRoutes from './routes/social.js'
import premiumRoutes from './routes/premium.js'
import authRoutes, { createRefreshToken } from './routes/auth.js'
import adminModerationRoutes from './routes/admin-moderation.js'
import smsRoutes from './routes/sms.js'
import moderationRoutes from './routes/moderation.js'
import iapRoutes from './routes/iap.js'
import gdprRoutes from './routes/gdpr.js'
import fcmRoutes from './routes/push-fcm.js'
import locationRoutes from './routes/location.js'
import scheduleRoutes from './routes/schedule.js'
import { metricsMiddleware, metricsRoute } from './metrics.js'
import { JWT_SECRET } from './middleware.js'
import { setupSwagger } from './swagger.js'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3002

const limiter = rateLimit({ windowMs: 60_000, max: 100, message: { message: 'Too many requests' } })
const authLimiter = rateLimit({ windowMs: 60_000, max: 60, message: { message: 'Too many auth attempts' } })

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(helmet())

// Request ID + structured logger
app.use((req, res, next) => {
  req.rid = req.headers['x-request-id'] || crypto.randomUUID()
  res.setHeader('X-Request-Id', req.rid)
  req.log = createLogger(req.rid)
  next()
})

app.use(metricsMiddleware)
app.get('/metrics', metricsRoute)
app.use('/api/premium/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/api/', limiter)
app.use('/api/auth/', authLimiter)
app.use('/api/premium/create-checkout', idempotency)

async function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }
  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET())

    const [rows] = await pool.query(
      'SELECT id, role FROM users WHERE id = ? AND role = ? AND is_active = 1',
      [decoded.userId, 'admin'],
    )
    if (rows.length === 0) {
      return next()
    }
    req.admin = rows[0]
    next()
  } catch {
    return next()
  }
}

// Dev route: auto-login as demo user (id=2, has chats in demo data)
app.post('/api/auth/dev-login', async (req, res) => {
  const token = jwt.sign({ userId: 2, role: 'user' }, JWT_SECRET(), { expiresIn: '24h' })
  res.json({ token, role: 'user' })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' })
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, email, role, password_hash, email_verified_at FROM users WHERE email = ? AND is_active = 1',
      [email],
    )
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const user = rows[0]
    const { default: bcrypt } = await import('bcryptjs')
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET(), { expiresIn: '24h' })
    const refresh_token = await createRefreshToken(user.id)
    res.json({ token, refresh_token, role: user.role, email_verified: !!user.email_verified_at })
  } catch (err) {
    rootLogger.error('Login error: ' + err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Public content endpoint (no auth)
app.get('/api/content', async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM content_config WHERE id = 1')
    if (!row) return res.json({ interests: [], dating_goals: [], education: [], banned_words: [], cities: [] })
    function parseJsonField(val, fallback) {
      if (Array.isArray(val)) return val
      if (typeof val === 'string') { try { return JSON.parse(val) } catch { return fallback || [] } }
      return fallback || []
    }
    const [cities] = await pool.query(
      'SELECT DISTINCT city FROM user_profiles WHERE city IS NOT NULL AND city != "" ORDER BY city',
    )
    res.json({
      interests: parseJsonField(row.interests, []),
      dating_goals: parseJsonField(row.dating_goals, []),
      education: parseJsonField(row.education, []),
      banned_words: parseJsonField(row.banned_words, []),
      cities: cities.map(c => c.city),
    })
  } catch (err) {
    rootLogger.error('Public content error: ' + err.message)
    res.status(500).json({ message: 'Failed to fetch content' })
  }
})

setupSwagger(app)

app.use(profileRoutes)
app.use(uploadRoutes)
app.use(pushRoutes)
app.use(premiumRoutes)
app.use(socialRoutes)
app.use(authRoutes)
app.use(smsRoutes)
app.use(moderationRoutes)
app.use(iapRoutes)
app.use(fcmRoutes)
app.use(locationRoutes)
app.use(scheduleRoutes)

app.use('/api/admin', adminAuth)

app.get('/api/admin/me', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token' })
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET())
    const [rows] = await pool.query(
      'SELECT u.id, u.role, up.display_name as name, u.email FROM users u LEFT JOIN user_profiles up ON u.id = up.id WHERE u.id = ?',
      [decoded.userId],
    )
    if (rows.length === 0) return res.status(401).json({ message: 'User not found' })
    res.json(rows[0])
  } catch {
    res.status(401).json({ message: 'Invalid token' })
  }
})

app.use('/api/admin', adminDashboard)
app.use('/api/admin', adminUsers)
app.use('/api/admin', adminAnalytics)
app.use('/api/admin', adminReports)
app.use('/api/admin', adminContent)
app.use('/api/admin', adminFeatures)
app.use('/api/admin', adminMessaging)
app.use('/api/admin', adminMonetization)
app.use('/api/admin', adminModerationRoutes)
app.use(gdprRoutes)

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected' })
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' })
  }
})

app.use((err, req, res, next) => {
  const log = req.log || rootLogger
  log.error('Unhandled error', err)
  res.status(500).json({ message: 'Internal server error' })
})

initSentry(app)

const httpServer = createServer(app)
initIO(httpServer)
startMessageCleanup()
httpServer.listen(PORT, () => {
  rootLogger.info(`SwiftMatch API running on port ${PORT}`)
  getRedis() // lazy connect
})

process.on('SIGTERM', async () => {
  rootLogger.info('SIGTERM received — shutting down')
  await disconnectRedis()
  await pool.end().catch(() => {})
  httpServer.close(() => process.exit(0))
})
