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
  const { offer_id: offerId, conversion_type: conversionType, lat, lng, city } = req.body || {}
  const type = ['click', 'booking', 'purchase', 'lead'].includes(conversionType) ? conversionType : 'click'
  if (!offerId || !/^\d+$/.test(String(offerId))) {
    return res.status(400).json({ message: 'offer_id is required' })
  }
  try {
    const [[offer]] = await pool.query(
      `SELECT o.id, o.partner_id, o.deeplink, o.city AS offer_city, o.lat AS offer_lat, o.lng AS offer_lng
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
    // {lat}/{lng} — точка юзера (body или query); {to_lat}/{to_lng} — место оффера, иначе точка юзера;
    // {city} — город оффера или юзера. Неизвестные и незаполненные плейсхолдеры сохраняются как есть.
    const query = req.query || {}
    const ctxLat = lat ?? query.lat
    const ctxLng = lng ?? query.lng
    const numOrNull = (v) =>
      v !== undefined && v !== null && String(v).trim() !== '' && !Number.isNaN(Number(v))
        ? encodeURIComponent(String(v))
        : null
    const placeholders = {
      lat: numOrNull(ctxLat),
      lng: numOrNull(ctxLng),
      to_lat:
        offer.offer_lat !== null && offer.offer_lat !== undefined
          ? encodeURIComponent(String(offer.offer_lat))
          : numOrNull(ctxLat ?? ''),
      to_lng:
        offer.offer_lng !== null && offer.offer_lng !== undefined
          ? encodeURIComponent(String(offer.offer_lng))
          : numOrNull(ctxLng ?? ''),
      city:
        (city || query.city) && String(city || query.city).trim() !== ''
          ? encodeURIComponent(String(city || query.city).trim())
          : null,
    }
    let deeplink = String(offer.deeplink).replace(/\{(\w+)\}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(placeholders, key) && placeholders[key] !== null
        ? placeholders[key]
        : match,
    )
    deeplink += `${deeplink.includes('?') ? '&' : '?'}utm_source=swiftmatch&ref=${encodeURIComponent(ref)}`
    res.json({ deeplink })
  } catch (err) {
    logger.error('Partner track error:', err)
    res.status(500).json({ message: 'Failed to track partner action' })
  }
})

/**
 * @openapi
 * /api/partners/postback/{id}:
 *   post:
 *     tags: [Partners]
 *     summary: S2S postback from a partner (server-to-server conversion)
 *     description: Auth via affiliate_token in "token" field, query param or Authorization header. Idempotent by external_order_id.
 *     responses:
 *       200: { description: "{ id, commission }" }
 *       401: { description: Invalid token }
 *       404: { description: Partner not found or paused }
 */
router.post('/api/partners/postback/:id', async (req, res) => {
  const { id } = req.params
  if (!/^\d+$/.test(id)) return res.status(400).json({ message: 'Invalid id' })
  const body = req.body || {}
  const token = body.token || req.query.token || (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const { external_order_id: externalOrderId, offer_id: offerId } = body
  const type = ['booking', 'purchase', 'lead'].includes(body.conversion_type) ? body.conversion_type : 'purchase'
  const amount = Number(body.amount)

  if (!externalOrderId || typeof externalOrderId !== 'string' || externalOrderId.length > 100) {
    return res.status(400).json({ message: 'external_order_id is required' })
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ message: 'Valid amount is required' })
  }

  try {
    const [[partner]] = await pool.query(
      `SELECT id, affiliate_token, commission_rate FROM partners
       WHERE id = ? AND status = 'active' AND affiliate_token IS NOT NULL AND affiliate_token != ''
       LIMIT 1`,
      [id],
    )
    if (!partner || !token || token !== partner.affiliate_token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const [[dup]] = await pool.query(
      `SELECT id FROM partner_conversions WHERE external_order_id = ? LIMIT 1`,
      [externalOrderId],
    )
    if (dup) {
      return res.json({ id: dup.id, duplicate: true })
    }

    let offerIdResolved = null
    if (offerId && /^\d+$/.test(String(offerId))) {
      const [[offer]] = await pool.query(
        'SELECT id FROM partner_offers WHERE id = ? AND partner_id = ? LIMIT 1',
        [offerId, partner.id],
      )
      offerIdResolved = offer ? offer.id : null
    }

    const commission = Math.round(amount * Number(partner.commission_rate)) / 100
    const [result] = await pool.query(
      `INSERT INTO partner_conversions
         (partner_id, offer_id, user_id, conversion_type, external_order_id, amount, commission, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [partner.id, offerIdResolved, body.user_id && /^\d+$/.test(String(body.user_id)) ? Number(body.user_id) : null,
       type, externalOrderId, amount, commission],
    )
    res.json({ id: result.insertId, commission })
  } catch (err) {
    logger.error('Partner postback error:', err)
    res.status(500).json({ message: 'Failed to process postback' })
  }
})

export default router
