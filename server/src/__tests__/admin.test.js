import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'

vi.mock('../db.js', () => ({
  default: { query: vi.fn() },
}))

vi.mock('../logger.js', () => ({
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
      .mockResolvedValueOnce([[{ total: 10 }], []])
      .mockResolvedValueOnce([[{ total: 5 }], []])
      .mockResolvedValueOnce([[{ total: 20 }], []])
      .mockResolvedValueOnce([[{ count: 200 }], []])

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('totalUsers')
    expect(res.body).toHaveProperty('newUsersToday')
    expect(res.body).toHaveProperty('activeUsers')
    expect(res.body).toHaveProperty('premiumUsers')
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
    pool.query.mockResolvedValue([[{ id: 1, email: 'test@test.com', role: 'user' }], []])
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
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

  it('returns feature flags', async () => {
    pool.query.mockResolvedValue([[{ flag_key: 'test_flag', enabled: 1 }, { flag_key: 'other_flag', enabled: 0 }], []])
    const res = await request(app)
      .get('/api/admin/features')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
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

  it('requires flag_key and enabled in body', async () => {
    const res = await request(app)
      .put('/api/admin/features')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({})
    expect(res.status).toBe(400)
  })
})

describe('GET /api/admin/analytics', () => {
  const app = createAdminApp(adminAnalytics)

  it('returns analytics data', async () => {
    pool.query
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[], []])

    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('registrations')
    expect(res.body).toHaveProperty('premium')
  })

  it('handles database error', async () => {
    pool.query.mockRejectedValue(new Error('DB error'))
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(500)
  })
})

describe('GET /api/admin/revenue (monetization)', () => {
  const app = createAdminApp(adminMonetization)

  it('returns revenue data', async () => {
    pool.query
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[], []])

    const res = await request(app)
      .get('/api/admin/revenue')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(200)
  })
})
