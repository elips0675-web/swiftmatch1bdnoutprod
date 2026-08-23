vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-secret'
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'

vi.mock('../db.js', () => ({
  default: { query: vi.fn() },
}))

vi.mock('../logger.js', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import pool from '../db.js'
import partnersRoutes from '../routes/partners.js'
import adminPartners from '../routes/admin/partners.js'

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

function createApp(...routes) {
  const app = express()
  app.use(express.json())
  routes.forEach((r) => app.use(r))
  return app
}

const userApp = createApp(partnersRoutes)
const adminApp = createApp(adminPartners)

function authToken(userId = 1) {
  return jwt.sign({ userId, role: 'user' }, JWT_SECRET, { expiresIn: '1h' })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/partners/offers', () => {
  it('requires auth', async () => {
    const res = await request(userApp).get('/api/partners/offers')
    expect(res.status).toBe(401)
  })

  it('returns array of active offers', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, title: 'Taxi', partner_name: 'Yandex Go' }], []])
    const res = await request(userApp)
      .get('/api/partners/offers')
      .set('Authorization', `Bearer ${authToken(2)}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].title).toBe('Taxi')
  })

  it('filters by placement via FIND_IN_SET param', async () => {
    pool.query.mockResolvedValueOnce([[], []])
    await request(userApp)
      .get('/api/partners/offers?placement=chat')
      .set('Authorization', `Bearer ${authToken(2)}`)
    const [sql, params] = pool.query.mock.calls[0]
    expect(sql).toContain('FIND_IN_SET')
    expect(params).toContain('chat')
  })

  it('adds geo distance and radius filter when lat/lng given', async () => {
    pool.query.mockResolvedValueOnce([[], []])
    await request(userApp)
      .get('/api/partners/offers?lat=59.93&lng=30.33&radius=5')
      .set('Authorization', `Bearer ${authToken(2)}`)
    const [sql, params] = pool.query.mock.calls[0]
    expect(sql).toContain('ST_Distance_Sphere')
    expect(sql).toContain('HAVING distance_m < ?')
    expect(params).toContain(5000)
  })
})

describe('POST /api/partners/track', () => {
  it('rejects missing offer_id', async () => {
    const res = await request(userApp)
      .post('/api/partners/track')
      .set('Authorization', `Bearer ${authToken(2)}`)
      .send({})
    expect(res.status).toBe(400)
  })

  it('returns 404 for paused offer', async () => {
    pool.query.mockResolvedValueOnce([[], []])
    const res = await request(userApp)
      .post('/api/partners/track')
      .set('Authorization', `Bearer ${authToken(2)}`)
      .send({ offer_id: 9 })
    expect(res.status).toBe(404)
  })

  it('inserts click conversion and returns deeplink with utm + ref', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 3, partner_id: 1, deeplink: 'https://afisha.ru/movie/' }], []])
      .mockResolvedValueOnce([{ insertId: 42 }, []])
      .mockResolvedValueOnce([[{ referral_code: 'ABC123' }], []])

    const res = await request(userApp)
      .post('/api/partners/track')
      .set('Authorization', `Bearer ${authToken(7)}`)
      .send({ offer_id: 3 })

    expect(res.status).toBe(200)
    expect(res.body.deeplink).toBe('https://afisha.ru/movie/?utm_source=swiftmatch&ref=ABC123')

    const insertCall = pool.query.mock.calls.find(([sql]) => sql.includes('INSERT INTO partner_conversions'))
    expect(insertCall[1]).toEqual([1, 3, 7, 'click'])
  })

  it('appends with & when deeplink already has query', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 4, partner_id: 2, deeplink: 'https://x.ru/?a=b' }], []])
      .mockResolvedValueOnce([{ insertId: 43 }, []])
      .mockResolvedValueOnce([[{ referral_code: null }], []])

    const res = await request(userApp)
      .post('/api/partners/track')
      .set('Authorization', `Bearer ${authToken(7)}`)
      .send({ offer_id: 4, conversion_type: 'booking' })

    expect(res.status).toBe(200)
    expect(res.body.deeplink).toBe('https://x.ru/?a=b&utm_source=swiftmatch&ref=')
  })
})

describe('Admin partners CRUD', () => {
  it('GET returns stats array even on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('db down'))
    const res = await request(adminApp).get('/partners')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('POST validates name', async () => {
    const res = await request(adminApp).post('/partners').send({ name: 'A' })
    expect(res.status).toBe(400)
  })

  it('POST creates partner', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 11 }, []])
    const res = await request(adminApp)
      .post('/partners')
      .send({ name: 'New Partner', type: 'deeplink' })
    expect(res.status).toBe(201)
    expect(res.body.id).toBe(11)
  })

  it('PUT rejects invalid status', async () => {
    const res = await request(adminApp).put('/partners/1').send({ status: 'deleted' })
    expect(res.status).toBe(400)
  })

  it('offer POST validates category and placement', async () => {
    const badCat = await request(adminApp)
      .post('/partners/1/offers')
      .send({ category: 'space', title: 'Test offer', deeplink: 'https://x.ru' })
    expect(badCat.status).toBe(400)

    const badPlacement = await request(adminApp)
      .post('/partners/1/offers')
      .send({ category: 'taxi', title: 'Test offer', deeplink: 'https://x.ru', placement: 'moon' })
    expect(badPlacement.status).toBe(400)
  })
})
