vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-secret'
})

import { describe, it, expect, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import { auth, optionalAuth, JWT_SECRET } from '../middleware.js'

function mockReqRes() {
  const req = { headers: {} }
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  }
  const next = vi.fn()
  return { req, res, next }
}

describe('auth middleware', () => {
  it('returns 401 without Authorization header', () => {
    const { req, res, next } = mockReqRes()
    auth(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 with malformed header', () => {
    const { req, res, next } = mockReqRes()
    req.headers.authorization = 'Basic token'
    auth(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 with invalid token', () => {
    const { req, res, next } = mockReqRes()
    req.headers.authorization = 'Bearer invalid-token'
    auth(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next with valid token', () => {
    const token = jwt.sign({ userId: 1, role: 'user' }, JWT_SECRET, { expiresIn: '1h' })
    const { req, res, next } = mockReqRes()
    req.headers.authorization = `Bearer ${token}`
    auth(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(req.userId).toBe(1)
  })

  it('sets userId from token payload', () => {
    const token = jwt.sign({ userId: 42, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' })
    const { req, res, next } = mockReqRes()
    req.headers.authorization = `Bearer ${token}`
    auth(req, res, next)
    expect(req.userId).toBe(42)
  })
})

describe('optionalAuth middleware', () => {
  it('sets userId to null without header', () => {
    const { req, res, next } = mockReqRes()
    optionalAuth(req, res, next)
    expect(req.userId).toBeNull()
    expect(next).toHaveBeenCalled()
  })

  it('sets userId with valid token', () => {
    const token = jwt.sign({ userId: 7, role: 'user' }, JWT_SECRET, { expiresIn: '1h' })
    const { req, res, next } = mockReqRes()
    req.headers.authorization = `Bearer ${token}`
    optionalAuth(req, res, next)
    expect(req.userId).toBe(7)
    expect(next).toHaveBeenCalled()
  })

  it('sets userId to null with invalid token', () => {
    const { req, res, next } = mockReqRes()
    req.headers.authorization = 'Bearer bad-token'
    optionalAuth(req, res, next)
    expect(req.userId).toBeNull()
    expect(next).toHaveBeenCalled()
  })
})
