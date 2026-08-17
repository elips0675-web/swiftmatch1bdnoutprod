import { Router } from 'express'
import pool from '../db.js'
import { auth } from '../middleware.js'
import logger from '../logger.js'
import { cacheRoute, invalidate } from '../cache.js'

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

router.get('/api/profile/me', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT up.id, up.display_name, up.name, up.age, up.bio, up.avatar_url,
              up.gender, up.looking_for, up.dating_goal, up.height,
              up.city, up.country, up.lat, up.lng,
              up.zodiac, up.circadian, up.attachment_style, up.education,
              up.super_likes, up.boost_until, up.incognito, up.passport_mode,
              up.passport_city, up.passport_lat, up.passport_lng,
              up.online, up.last_seen, up.created_at, up.updated_at,
              u.email
       FROM user_profiles up
       JOIN users u ON u.id = up.id
       WHERE up.id = ?`,
      [req.userId],
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Profile not found' })

    const [photos] = await pool.query(
      'SELECT id, url, sort_order, is_avatar FROM user_photos WHERE user_id = ? ORDER BY sort_order',
      [req.userId],
    )
    const [interests] = await pool.query(
      `SELECT i.id, i.name_ru, i.name_en FROM interests i
       JOIN user_interests ui ON ui.interest_id = i.id
       WHERE ui.user_id = ?`,
      [req.userId],
    )

    const { location, ...profile } = rows[0]
    res.json({ ...profile, photos, interests })
  } catch (err) {
    logger.error('Profile GET /me error:', err)
    res.status(500).json({ message: 'Failed to fetch profile' })
  }
})

router.put('/api/profile/score', auth, async (req, res) => {
  try {
    const [[profile]] = await pool.query(
      `SELECT p.display_name, p.bio, p.city, p.lat, p.lng, p.zodiac, p.education, p.dating_goal,
              p.height, p.attachment_style, p.gender
       FROM user_profiles p WHERE p.id = ?`,
      [req.userId],
    )
    if (!profile) return res.status(404).json({ message: 'Profile not found' })

    const [photos] = await pool.query(
      'SELECT COUNT(*) as cnt FROM user_photos WHERE user_id = ? AND moderation_status = ?',
      [req.userId, 'approved'],
    )
    const photoCount = photos[0]?.cnt || 0

    const [interests] = await pool.query(
      'SELECT COUNT(*) as cnt FROM user_interests WHERE user_id = ?',
      [req.userId],
    )
    const interestCount = interests[0]?.cnt || 0

    let score = 0
    if (profile.display_name) score += 10
    if (profile.bio) score += Math.min(15, Math.floor(profile.bio.length / 15))
    if (profile.gender) score += 5
    if (profile.city || profile.lat) score += 10
    if (profile.zodiac) score += 5
    if (profile.education) score += 5
    if (profile.dating_goal) score += 10
    if (profile.height) score += 5
    if (profile.attachment_style) score += 5
    score += Math.min(15, photoCount * 5)
    score += Math.min(15, interestCount * 3)
    score = Math.min(100, Math.round(score))

    await pool.query(
      'UPDATE user_profiles SET profile_score = ?, profile_score_updated_at = NOW() WHERE id = ?',
      [score, req.userId],
    )

    res.json({ score, photoCount, interestCount })
  } catch (err) {
    logger.error('Profile score error:', err)
    res.status(500).json({ message: 'Failed to calculate profile score' })
  }
})

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
    const { display_name, name, age, bio, gender, looking_for, dating_goal, height, city, country, zodiac, circadian, attachment_style, education, interests, incognito, passport_mode, passport_city, passport_lat, passport_lng } = req.body

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
        incognito = COALESCE(?, incognito),
        passport_mode = COALESCE(?, passport_mode),
        passport_city = COALESCE(?, passport_city),
        passport_lat = COALESCE(?, passport_lat),
        passport_lng = COALESCE(?, passport_lng),
        country = COALESCE(?, country),
        zodiac = COALESCE(?, zodiac),
        circadian = COALESCE(?, circadian),
        attachment_style = COALESCE(?, attachment_style),
        education = COALESCE(?, education)
      WHERE id = ?`,
      [display_name, name, age, bio, gender, looking_for, dating_goal, height, city, incognito, passport_mode, passport_city, passport_lat, passport_lng, country, zodiac, circadian, attachment_style, education, req.params.id],
    )

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
    await pool.query('UPDATE users SET is_active = 0, email = CONCAT(email, \'.deleted\', UNIX_TIMESTAMP()) WHERE id = ?', [req.userId])
    res.json({ message: 'Account deleted' })
  } catch (err) {
    logger.error('Delete account error:', err)
    res.status(500).json({ message: 'Failed to delete account' })
  }
})

// ─── Privacy settings ───────────────────────────────────────────
router.get('/api/settings/privacy', auth, async (req, res) => {
  try {
    const [[profile]] = await pool.query(
      'SELECT incognito, passport_mode, passport_city, passport_lat, passport_lng FROM user_profiles WHERE id = ?',
      [req.userId],
    )
    if (!profile) return res.status(404).json({ message: 'Profile not found' })
    res.json({
      incognito: Boolean(profile.incognito),
      passport_mode: Boolean(profile.passport_mode),
      passport_city: profile.passport_city,
      passport_lat: profile.passport_lat,
      passport_lng: profile.passport_lng,
    })
  } catch (err) {
    logger.error('Privacy GET error:', err)
    res.status(500).json({ message: 'Failed to fetch privacy settings' })
  }
})

router.put('/api/settings/privacy', auth, async (req, res) => {
  try {
    const { incognito, passport_mode, passport_city, passport_lat, passport_lng } = req.body

    if (incognito || passport_mode) {
      const [subRows] = await pool.query(
        "SELECT id FROM subscriptions WHERE user_id = ? AND is_active = 1 AND expires_at > NOW() LIMIT 1",
        [req.userId],
      )
      if (subRows.length === 0) {
        return res.status(403).json({ message: 'Premium subscription required for this feature', code: 'PREMIUM_REQUIRED' })
      }
    }

    await pool.query(
      `UPDATE user_profiles SET
        incognito = COALESCE(?, incognito),
        passport_mode = COALESCE(?, passport_mode),
        passport_city = COALESCE(?, passport_city),
        passport_lat = COALESCE(?, passport_lat),
        passport_lng = COALESCE(?, passport_lng)
      WHERE id = ?`,
      [incognito, passport_mode, passport_city, passport_lat, passport_lng, req.userId],
    )
    invalidate(`route:/api/profile/${req.userId}*`).catch(() => {})
    res.json({ message: 'Privacy settings updated' })
  } catch (err) {
    logger.error('Privacy PUT error:', err)
    res.status(500).json({ message: 'Failed to update privacy settings' })
  }
})

export default router
