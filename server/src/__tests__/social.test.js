vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-secret'
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'

vi.mock('../db.js', () => ({
  default: {
    query: vi.fn(),
  },
}))

vi.mock('../ws.js', () => ({
  getIO: vi.fn(() => ({
    to: vi.fn(() => ({ emit: vi.fn() })),
  })),
}))

vi.mock('../banned-words.js', () => ({
  getBannedWords: vi.fn(() => []),
  containsBannedWord: vi.fn(() => false),
}))

vi.mock('./push.js', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  sendPushToUser: vi.fn(),
  sendPushToAll: vi.fn(),
}))

import pool from '../db.js'
import socialRoutes from '../routes/social.js'

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

function createApp() {
  const app = express()
  app.use(express.json())
  app.use(socialRoutes)
  return app
}

function authToken(userId = 1) {
  return jwt.sign({ userId, role: 'user' }, JWT_SECRET, { expiresIn: '1h' })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/chats', () => {
  it('requires auth', async () => {
    const app = createApp()
    const res = await request(app).get('/api/chats')
    expect(res.status).toBe(401)
  })

  it('returns chat list with unread count', async () => {
    pool.query.mockResolvedValue([[{ id: 1, last_message: 'Hi', unread_count: 2 }], []])
    const app = createApp()
    const res = await request(app).get('/api/chats').set('Authorization', `Bearer ${authToken()}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0]).toHaveProperty('unread_count', 2)
  })
})

describe('PUT /api/chats/:chatId/read', () => {
  it('marks chat as read', async () => {
    pool.query.mockResolvedValue([[], []])
    const app = createApp()
    const res = await request(app).put('/api/chats/1/read').set('Authorization', `Bearer ${authToken()}`)
    expect(res.status).toBe(200)
  })
})

describe('GET /api/chats/:chatId/messages', () => {
  it('returns messages with reactions', async () => {
    pool.query
      .mockResolvedValueOnce([[{ chat_id: 1 }], []])
      .mockResolvedValueOnce([[{ id: 1, sender_id: 1, text: 'Hello', created_at: new Date().toISOString() }], []])
      .mockResolvedValueOnce([[{ user_id: 2, last_read_at: new Date().toISOString() }], []])
      .mockResolvedValueOnce([[{ id: 10, message_id: 1, user_id: 2, emoji: '❤️', created_at: new Date().toISOString(), user_name: 'User2' }], []])
    const app = createApp()
    const res = await request(app).get('/api/chats/1/messages').set('Authorization', `Bearer ${authToken()}`)
    expect(res.status).toBe(200)
    expect(res.body[0]).toHaveProperty('reactions')
    expect(res.body[0].reactions).toHaveLength(1)
  })
})

describe('POST /api/chats/:chatId/messages/:msgId/reactions', () => {
  it('toggles reaction', async () => {
    pool.query
      .mockResolvedValueOnce([[{ chat_id: 1 }], []])
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ insertId: 10 }, []])
      .mockResolvedValueOnce([[{ id: 10, message_id: 1, user_id: 1, emoji: '👍', created_at: new Date().toISOString(), user_name: 'Me' }], []])
    const app = createApp()
    const res = await request(app).post('/api/chats/1/messages/1/reactions').set('Authorization', `Bearer ${authToken()}`).send({ emoji: '👍' })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('emoji', '👍')
  })
})

describe('POST /api/likes', () => {
  it('requires auth', async () => {
    const app = createApp()
    const res = await request(app).post('/api/likes').send({ liked_user_id: 2 })
    expect(res.status).toBe(401)
  })

  it('sends like and creates notification', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ insertId: 1 }, []])
      .mockResolvedValueOnce([[{ id: 1, type: 'like', payload: '{}', created_at: new Date().toISOString() }], []])
      .mockResolvedValueOnce([[{ display_name: 'Test' }], []])
    const app = createApp()
    const res = await request(app).post('/api/likes').set('Authorization', `Bearer ${authToken()}`).send({ liked_user_id: 2 })
    expect(res.status).toBe(201)
  })
})
