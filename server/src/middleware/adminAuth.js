import jwt from 'jsonwebtoken'
import pool from '../db.js'
import { rootLogger } from '../logger.js'
import { JWT_SECRET } from '../middleware.js'
import { extractToken } from '../cookies.js'

export async function adminAuth(req, res, next) {
  const token = extractToken(req)
  if (!token) {
    return res.status(401).json({ message: 'ADMIN_REQUIRED' })
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET())

    const [rows] = await pool.query(
      'SELECT id, email, role FROM users WHERE id = ? AND role = ? AND is_active = 1',
      [decoded.userId, 'admin'],
    )
    if (rows.length === 0) {
      return res.status(403).json({ message: 'ADMIN_REQUIRED' })
    }
    req.admin = rows[0]
    next()
  } catch {
    return res.status(401).json({ message: 'ADMIN_REQUIRED' })
  }
}
