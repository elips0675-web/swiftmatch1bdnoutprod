import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'

vi.mock('../db.js', () => ({
  default: { query: vi.fn() },
}))

vi.mock('../logger.js', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
  rootLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import pool from '../db.js'
import adminDashboard from '../routes/admin/dashboard.js'
import adminUsers from '../routes/admin/users.js'
import adminFeatures from '../routes/admin/features.js'
import adminAnalytics from '../routes/admin/analytics.js'
import adminMonetization from '../routes/admin/monetization.js'

const JWT_SECRET = 'change-me-in-production'

function createAdminApp(router) {
  const app = express()
  app.use(express.json())
  app.use('/api/admin', (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next()
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET)
      req.admin = decoded
      next()
    } catch { next() }
  })
  app.use('/api/admin', router)
  return app
}

function adminToken() {
  return jwt.sign({ userId: 1, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/admin/stats (dashboard)', () => {
  const app = createAdminApp(adminDashboard)

  it('returns dashboard stats', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 100 }], []])
      .mockResolvedValueOnce([[{ activeToday: 10 }], []])
      .mockResolvedValueOnce([[{ totalMatches: 5 }], []])
      .mockResolvedValueOnce([[{ revenue: 200 }], []])
      .mockResolvedValueOnce([[{ activeSubs: 20 }], []])
      .mockResolvedValueOnce([[{ newToday: 30 }], []])

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('totalUsers')
    expect(res.body).toHaveProperty('newToday')
    expect(res.body).toHaveProperty('activeToday')
    expect(res.body).toHaveProperty('activeSubs')
    expect(res.body).toHaveProperty('totalMatches')
  })

  it('handles database error', async () => {
    pool.query.mockRejectedValue(new Error('DB error'))
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(500)
  })
})

describe('GET /api/admin/users (admin users route)', () => {
  const app = createAdminApp(adminUsers)

  it('returns user list', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 1 }], []])
      .mockResolvedValueOnce([[{ id: 1, email: 'test@test.com', role: 'user' }], []])
      .mockResolvedValueOnce([[{ cities: '["Moscow","SPb"]' }], []])
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('users')
    expect(res.body.users).toHaveLength(1)
    expect(res.body).toHaveProperty('total')
  })

  it('handles database error', async () => {
    pool.query.mockRejectedValue(new Error('DB error'))
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(500)
  })
})

describe('GET /api/admin/features', () => {
  const app = createAdminApp(adminFeatures)

  it('returns feature flags as object', async () => {
    pool.query.mockResolvedValue([[{ id: 1, video_calls_enabled: 1, ai_icebreakers_enabled: 1, ai_compatibility_enabled: 1, groups_page_enabled: 1, contest_enabled: 1, show_ads: 0, autosearch_enabled: 1 }], []])
    const res = await request(app)
      .get('/api/admin/features')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(200)
    expect(typeof res.body).toBe('object')
    expect(res.body).toHaveProperty('videoCalls')
    expect(res.body).toHaveProperty('aiIcebreakers')
  })

  it('returns defaults when no row', async () => {
    pool.query.mockResolvedValue([[], []])
    const res = await request(app)
      .get('/api/admin/features')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(200)
    expect(res.body.videoCalls).toBe(true)
  })

  it('handles database error', async () => {
    pool.query.mockRejectedValue(new Error('DB error'))
    const res = await request(app)
      .get('/api/admin/features')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(500)
  })
})

describe('PUT /api/admin/features', () => {
  const app = createAdminApp(adminFeatures)

  it('requires at least one known flag key', async () => {
    const res = await request(app)
      .put('/api/admin/features')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({})
    expect(res.status).toBe(400)
  })

  it('updates features', async () => {
    pool.query
      .mockResolvedValueOnce([[], []])
    const res = await request(app)
      .put('/api/admin/features')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ videoCalls: true, aiIcebreakers: false })
    expect(res.status).toBe(200)
  })
})

describe('GET /api/admin/analytics/overview', () => {
  const app = createAdminApp(adminAnalytics)

  it('returns analytics overview', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 100 }], []])
      .mockResolvedValueOnce([[{ lastMonth: 10 }], []])
      .mockResolvedValueOnce([[{ premium: 5 }], []])

    const res = await request(app)
      .get('/api/admin/analytics/overview')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('mau')
    expect(res.body).toHaveProperty('conversionRate')
    expect(res.body).toHaveProperty('arpu')
  })
})

describe('GET /api/admin/analytics/registrations', () => {
  const app = createAdminApp(adminAnalytics)

  it('returns registration data', async () => {
    pool.query.mockResolvedValue([[{ day: '2024-01-01', users: 5 }], []])
    const res = await request(app)
      .get('/api/admin/analytics/registrations')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('GET /api/admin/monetization/revenue', () => {
  const app = createAdminApp(adminMonetization)

  it('returns revenue data', async () => {
    pool.query
      .mockResolvedValueOnce([[], []])

    const res = await request(app)
      .get('/api/admin/monetization/revenue')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(200)
  })
})
