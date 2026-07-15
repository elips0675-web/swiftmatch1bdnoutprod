import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../db.js', () => ({
  default: { query: vi.fn() },
}))

vi.mock('../logger.js', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
  rootLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

vi.mock('multer', () => {
  const mockSingle = vi.fn()
  return {
    default: () => ({
      single: () => mockSingle,
    }),
    __mockSingle: mockSingle,
  }
})

import pool from '../db.js'
import uploadRoutes from '../routes/upload.js'

function createApp() {
  const app = express()
  app.use(express.json())
  app.use(uploadRoutes)
  return app
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/photos/:userId', () => {
  const app = createApp()

  it('returns user photos', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, url: '/uploads/1.jpg', sort_order: 0, is_avatar: false }], []])
    const res = await request(app).get('/api/photos/1')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].url).toBe('/uploads/1.jpg')
  })

  it('returns empty array for no photos', async () => {
    pool.query.mockResolvedValueOnce([[], []])
    const res = await request(app).get('/api/photos/99')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('handles database error', async () => {
    pool.query.mockRejectedValue(new Error('DB error'))
    const res = await request(app).get('/api/photos/1')
    expect(res.status).toBe(500)
  })
})

describe('DELETE /api/photos/:id', () => {
  const app = createApp()

  it('returns 404 for non-existent photo', async () => {
    pool.query.mockResolvedValueOnce([[], []])
    const res = await request(app).delete('/api/photos/999')
    expect(res.status).toBe(404)
  })

  it('deletes existing photo', async () => {
    pool.query
      .mockResolvedValueOnce([[{ url: '/uploads/test.jpg' }], []])
      .mockResolvedValueOnce([[], []])
    const res = await request(app).delete('/api/photos/1')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('handles database error', async () => {
    pool.query.mockRejectedValue(new Error('DB error'))
    const res = await request(app).delete('/api/photos/1')
    expect(res.status).toBe(500)
  })
})
