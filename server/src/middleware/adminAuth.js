import jwt from 'jsonwebtoken'
import pool from '../db.js'
import { rootLogger } from '../logger.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

export async function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }
  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

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
