import { Router } from 'express'
import pool from '../db.js'
import { auth } from '../middleware.js'
import logger from '../logger.js'

const router = Router()

/**
 * GET /api/notifications
 * Список последних уведомлений текущего пользователя + счётчик непрочитанных.
 * payload (JSON) обогащается именами автора и встречи для отображения.
 */
router.get('/api/notifications', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.id, n.type, n.payload, n.is_read, n.created_at,
              up.display_name AS actor_name,
              h.title AS hangout_title
       FROM notifications n
       LEFT JOIN user_profiles up
              ON up.id = CAST(JSON_UNQUOTE(JSON_EXTRACT(n.payload, '$.from_user_id')) AS UNSIGNED)
       LEFT JOIN hangouts h
              ON h.id = CAST(JSON_UNQUOTE(JSON_EXTRACT(n.payload, '$.hangout_id')) AS UNSIGNED)
       WHERE n.user_id = ? AND n.deleted_at IS NULL
       ORDER BY n.created_at DESC
       LIMIT 30`,
      [req.userId],
    )
    const [[{ unread }]] = await pool.query(
      'SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0 AND deleted_at IS NULL',
      [req.userId],
    )

    const items = rows.map((row) => ({
      ...row,
      payload: typeof row.payload === 'string' ? safeParse(row.payload) : row.payload || {},
    }))
    res.json({ items, unread })
  } catch (err) {
    logger.error('Notifications list error:', err)
    res.status(500).json({ message: 'Failed to fetch notifications' })
  }
})

function safeParse(value) {
  try { return JSON.parse(value) } catch { return {} }
}

router.put('/api/notifications/read-all', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0 AND deleted_at IS NULL',
      [req.userId],
    )
    res.json({ message: 'All notifications marked as read' })
  } catch (err) {
    logger.error('Notifications read-all error:', err)
    res.status(500).json({ message: 'Failed to mark notifications' })
  }
})

router.put('/api/notifications/:id/read', auth, async (req, res) => {
  const { id } = req.params
  if (!/^\d+$/.test(id)) return res.status(400).json({ message: 'Invalid id' })
  try {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, req.userId],
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Notification not found' })
    res.json({ message: 'Marked as read' })
  } catch (err) {
    logger.error('Notifications read error:', err)
    res.status(500).json({ message: 'Failed to mark notification' })
  }
})

export default router
