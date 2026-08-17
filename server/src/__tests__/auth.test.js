import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'

vi.mock('../db.js', () => ({
  default: {
    query: vi.fn(),
  },
}))

import pool from '../db.js'
import authRoutes from '../routes/auth.js'

function createApp() {
  const app = express()
  app.use(express.json())
  app.use(authRoutes)
  return app
}

const JWT_SECRET = 'change-me-in-production'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/auth/register', () => {
  it('requires email and password', async () => {
    const app = createApp()
    const res = await request(app).post('/api/auth/register').send({})
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/required/i)
  })

  it('rejects short password', async () => {
    const app = createApp()
    const res = await request(app).post('/api/auth/register').send({ email: 'test@test.com', password: '123' })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/6 characters/i)
  })

  it('rejects duplicate email', async () => {
    pool.query.mockResolvedValue([[{ id: 1 }], []])
    const app = createApp()
    const res = await request(app).post('/api/auth/register').send({ email: 'exists@test.com', password: '123456' })
    expect(res.status).toBe(409)
    expect(res.body.message).toMatch(/already registered/i)
  })

  it('creates account successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ insertId: 1 }, []])
      .mockResolvedValueOnce([[], []])
    const app = createApp()
    const res = await request(app).post('/api/auth/register').send({ email: 'new@test.com', password: '123456', displayName: 'Test' })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('userId', 1)
  })

  it('records data_processing consent when consent=true', async () => {
    pool.query
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ insertId: 42 }, []])
      .mockResolvedValueOnce([[], []])
    const app = createApp()
    const res = await request(app).post('/api/auth/register').send({ email: 'consent@test.com', password: '123456', displayName: 'Test', consent: true })
    expect(res.status).toBe(201)
    const consentCall = pool.query.mock.calls.find((c) => String(c[0]).includes('consent_log'))
    expect(consentCall).toBeTruthy()
    expect(consentCall[1].slice(0, 2)).toEqual([42, 'data_processing'])
  })

  it('does not record consent when consent absent', async () => {
    pool.query
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ insertId: 43 }, []])
      .mockResolvedValueOnce([[], []])
    const app = createApp()
    const res = await request(app).post('/api/auth/register').send({ email: 'noconsent@test.com', password: '123456' })
    expect(res.status).toBe(201)
    expect(pool.query.mock.calls.some((c) => String(c[0]).includes('consent_log'))).toBe(false)
  })
})

describe('POST /api/auth/forgot-password', () => {
  it('requires email', async () => {
    const app = createApp()
    const res = await request(app).post('/api/auth/forgot-password').send({})
    expect(res.status).toBe(400)
  })

  it('returns generic message whether user exists or not', async () => {
    pool.query.mockResolvedValue([[], []])
    const app = createApp()
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nonexistent@test.com' })
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/If the email exists/i)
  })

  it('updates reset token for existing user', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([[], []])
    const app = createApp()
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'exists@test.com' })
    expect(res.status).toBe(200)
  })
})

describe('POST /api/auth/reset-password', () => {
  it('requires token and password', async () => {
    const app = createApp()
    const res = await request(app).post('/api/auth/reset-password').send({})
    expect(res.status).toBe(400)
  })

  it('rejects invalid token', async () => {
    pool.query.mockResolvedValue([[], []])
    const app = createApp()
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'bad', password: '123456' })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/Invalid/i)
  })
})

describe('POST /api/auth/verify-email', () => {
  it('requires token', async () => {
    const app = createApp()
    const res = await request(app).post('/api/auth/verify-email').send({})
    expect(res.status).toBe(400)
  })

  it('rejects invalid token', async () => {
    pool.query.mockResolvedValue([[], []])
    const app = createApp()
    const res = await request(app).post('/api/auth/verify-email').send({ token: 'bad' })
    expect(res.status).toBe(400)
  })
})
