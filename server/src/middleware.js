import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { extractToken } from './cookies.js'

function getJwtSecret() {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in environment for production')
  }
  return process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
}

export function auth(req, res, next) {
  const token = extractToken(req)
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' })
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret())
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export function optionalAuth(req, res, next) {
  const token = extractToken(req)
  if (!token) {
    req.userId = null
    return next()
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret())
    req.userId = decoded.userId
  } catch {
    req.userId = null
  }
  next()
}

export { getJwtSecret as JWT_SECRET }
