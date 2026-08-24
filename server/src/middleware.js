import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { ACCESS_COOKIE } from './cookies.js'

function getJwtSecret() {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in environment for production')
  }
  return process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
}

function decodeAny(...tokens) {
  // Устаревший Bearer из легаси-storage не должен перекрывать валидную cookie
  for (const token of tokens) {
    if (!token) continue
    try {
      return jwt.verify(token, getJwtSecret())
    } catch { /* невалидный токен — проверяем следующий источник */ }
  }
  return null
}

function getTokens(req) {
  const header = req.headers?.authorization
  const headerToken = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null
  return [headerToken, req.cookies?.[ACCESS_COOKIE]]
}

export function auth(req, res, next) {
  const [headerToken, cookieToken] = getTokens(req)
  const decoded = decodeAny(headerToken, cookieToken)
  if (!decoded) {
    const hasAny = Boolean(headerToken || cookieToken)
    return res.status(401).json({ message: hasAny ? 'Invalid or expired token' : 'Authentication required' })
  }
  req.userId = decoded.userId
  next()
}

export function optionalAuth(req, res, next) {
  const [headerToken, cookieToken] = getTokens(req)
  const decoded = decodeAny(headerToken, cookieToken)
  req.userId = decoded ? decoded.userId : null
  next()
}

export { getJwtSecret as JWT_SECRET }
