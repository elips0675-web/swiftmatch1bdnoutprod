import { Router } from 'express'
import pool from '../db.js'
import { auth } from '../middleware.js'
import logger from '../logger.js'
import { cacheRoute, invalidate } from '../cache.js'

import { softDelete } from '../audit.js'

const router = Router()

/**
 * @openapi
 * /api/profile/{id}:
 *   get:
 *     tags: [Profile]
 *     summary: Get user profile by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       404:
 *         description: Profile not found
 *   put:
 *     tags: [Profile]
 *     summary: Update user profile
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name: { type: string }
 *               age: { type: integer }
 *               bio: { type: string }
 *               gender: { type: string }
 *               city: { type: string }
 *               interests: { type: array, items: { type: integer } }
 *     responses:
 *       200:
 *         description: Updated profile
 *       500:
 *         description: Failed to update profile
 *
 * /api/profile/me:
 *   delete:
 *     tags: [Profile]
 *     summary: Delete own account (soft delete)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 *       401:
 *         description: Authentication required
 */

function parseJsonField(val, fallback) {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') { try { return JSON.parse(val) } catch { return fallback || [] } }
  return fallback || []
}

router.get('/api/profile/:id', cacheRoute(60), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT up.*, u.email FROM user_profiles up
       JOIN users u ON u.id = up.id
       WHERE up.id = ?`,
      [req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Profile not found' })

    const [photos] = await pool.query(
      'SELECT id, url, sort_order, is_avatar FROM user_photos WHERE user_id = ? ORDER BY sort_order',
      [req.params.id],
    )
    const [interests] = await pool.query(
      `SELECT i.id, i.name_ru, i.name_en FROM interests i
       JOIN user_interests ui ON ui.interest_id = i.id
       WHERE ui.user_id = ?`,
      [req.params.id],
    )

    res.json({ ...rows[0], photos, interests })
  } catch (err) {
    logger.error('Profile GET error:', err)
    res.status(500).json({ message: 'Failed to fetch profile' })
  }
})

router.put('/api/profile/:id', async (req, res) => {
  try {
    const { display_name, name, age, bio, gender, looking_for, dating_goal, height, city, country, lat, lng, zodiac, circadian, attachment_style, education, interests } = req.body

    await pool.query(
      `UPDATE user_profiles SET
        display_name = COALESCE(?, display_name),
        name = COALESCE(?, name),
        age = COALESCE(?, age),
        bio = COALESCE(?, bio),
        gender = COALESCE(?, gender),
        looking_for = COALESCE(?, looking_for),
        dating_goal = COALESCE(?, dating_goal),
        height = COALESCE(?, height),
        city = COALESCE(?, city),
        country = COALESCE(?, country),
        lat = COALESCE(?, lat),
        lng = COALESCE(?, lng),
        zodiac = COALESCE(?, zodiac),
        circadian = COALESCE(?, circadian),
        attachment_style = COALESCE(?, attachment_style),
        education = COALESCE(?, education)
      WHERE id = ?`,
      [display_name, name, age, bio, gender, looking_for, dating_goal, height, city, country, lat ?? null, lng ?? null, zodiac, circadian, attachment_style, education, req.params.id],
    )

    if (lat !== undefined && lng !== undefined) {
      await pool.query(
        'UPDATE user_profiles SET location = ST_SRID(POINT(?, ?), 4326) WHERE id = ?',
        [lng, lat, req.params.id],
      )
    }

    if (interests && Array.isArray(interests)) {
      await pool.query('DELETE FROM user_interests WHERE user_id = ?', [req.params.id])
      for (const interestId of interests) {
        await pool.query('INSERT IGNORE INTO user_interests (user_id, interest_id) VALUES (?, ?)', [req.params.id, interestId])
      }
    }

    invalidate(`route:/api/profile/${req.params.id}*`).catch(() => {})

    const [rows] = await pool.query('SELECT * FROM user_profiles WHERE id = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) {
    logger.error('Profile PUT error:', err)
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

// ─── Account deletion ──────────────────────────────────────────
router.delete('/api/profile/me', auth, async (req, res) => {
  try {
    await softDelete('users', req.userId, req.userId, req.ip)
    await pool.query('UPDATE users SET is_active = 0, email = CONCAT(email, \'.deleted\', UNIX_TIMESTAMP()) WHERE id = ?', [req.userId])
    res.json({ message: 'Account deleted' })
  } catch (err) {
    logger.error('Delete account error:', err)
    res.status(500).json({ message: 'Failed to delete account' })
  }
})

export default router
