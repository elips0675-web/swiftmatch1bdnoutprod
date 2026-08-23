import { Router } from 'express'
import pool from '../db.js'
import { auth } from '../middleware.js'
import logger from '../logger.js'

const router = Router()

/**
 * @openapi
 * /api/partners/offers:
 *   get:
 *     tags: [Partners]
 *     summary: Partner offers feed (Wave 1 deeplink partners)
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: placement
 *         schema: { type: string, enum: [hangout, chat, profile, passport, attachment_result] }
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *       - in: query
 *         name: lng
 *         schema: { type: number }
 *       - in: query
 *         name: radius
 *         schema: { type: number, description: "km" }
 *     responses:
 *       200: { description: Array of active offers }
 */
router.get('/api/partners/offers', auth, async (req, res) => {
  const { category, city, placement, lat, lng, radius } = req.query
  const where = ["o.status = 'active'", "p.status = 'active'"]
  const params = []
  if (category) {
    where.push('o.category = ?')
    params.push(String(category))
  }
  if (city) {
    where.push('(o.city = ? OR o.city IS NULL)')
    params.push(String(city))
  }
  if (placement) {
    where.push('FIND_IN_SET(?, o.placement)')
    params.push(String(placement))
  }
  let geoSelect = ''
  if (lat !== undefined && lng !== undefined && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
    geoSelect = ', ST_Distance_Sphere(POINT(?, ?), POINT(o.lng, o.lat)) AS distance_m'
    params.push(Number(lng), Number(lat))
    if (radius !== undefined && !Number.isNaN(Number(radius))) {
      where.push('HAVING distance_m < ?')
      params.push(Number(radius) * 1000)
    }
  }
  try {
    const sql = `SELECT o.id, o.partner_id, p.name AS partner_name, o.category, o.title,
                        o.description, o.image_url, o.price, o.city, o.placement${geoSelect}
                 FROM partner_offers o
                 JOIN partners p ON p.id = o.partner_id
                 WHERE ${where.join(' AND ')}
                   AND (o.valid_from IS NULL OR o.valid_from <= CURDATE())
                   AND (o.valid_to IS NULL OR o.valid_to >= CURDATE())
                 ORDER BY o.created_at DESC
                 LIMIT 20`
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    logger.error('Partner offers error:', err)
    res.status(500).json({ message: 'Failed to fetch partner offers' })
  }
})

/**
 * @openapi
 * /api/partners/track:
 *   post:
 *     tags: [Partners]
 *     summary: Track a click/conversion and return the tagged deeplink
 *     responses:
 *       200: { description: "{ deeplink } with utm_source=swiftmatch&ref=<referral_code>" }
 *       404: { description: Offer not found or paused }
 */
router.post('/api/partners/track', auth, async (req, res) => {
  const { offer_id: offerId, conversion_type: conversionType } = req.body || {}
  const type = ['click', 'booking', 'purchase', 'lead'].includes(conversionType) ? conversionType : 'click'
  if (!offerId || !/^\d+$/.test(String(offerId))) {
    return res.status(400).json({ message: 'offer_id is required' })
  }
  try {
    const [[offer]] = await pool.query(
      `SELECT o.id, o.partner_id, o.deeplink
       FROM partner_offers o JOIN partners p ON p.id = o.partner_id
       WHERE o.id = ? AND o.status = 'active' AND p.status = 'active'
       LIMIT 1`,
      [offerId],
    )
    if (!offer) return res.status(404).json({ message: 'Offer not found or paused' })

    await pool.query(
      `INSERT INTO partner_conversions (partner_id, offer_id, user_id, conversion_type)
       VALUES (?, ?, ?, ?)`,
      [offer.partner_id, offer.id, req.userId, type],
    )

    const [[user]] = await pool.query('SELECT referral_code FROM users WHERE id = ? LIMIT 1', [req.userId])
    const ref = user && user.referral_code ? user.referral_code : ''
    const sep = offer.deeplink.includes('?') ? '&' : '?'
    res.json({ deeplink: `${offer.deeplink}${sep}utm_source=swiftmatch&ref=${encodeURIComponent(ref)}` })
  } catch (err) {
    logger.error('Partner track error:', err)
    res.status(500).json({ message: 'Failed to track partner action' })
  }
})

export default router
