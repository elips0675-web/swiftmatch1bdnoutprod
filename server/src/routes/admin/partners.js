import { Router } from 'express'
import pool from '../../db.js'
import logger from '../../logger.js'

const router = Router()

const OFFER_CATEGORIES = ['cinema', 'restaurant', 'flowers', 'taxi', 'hotel', 'spa', 'photo', 'gift', 'event', 'experience']
const PLACEMENTS = ['hangout', 'chat', 'profile', 'passport', 'attachment_result']

/**
 * @openapi
 * /api/admin/partners:
 *   get:
 *     tags: [Admin]
 *     summary: Partners list with click/conversion stats
 *     responses:
 *       200: { description: Array of partners with stats }
 */
router.get('/partners', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.type, p.commission_rate, p.status, p.created_at,
              (SELECT COUNT(*) FROM partner_offers o WHERE o.partner_id = p.id) AS offers_count,
              (SELECT COUNT(*) FROM partner_conversions c WHERE c.partner_id = p.id AND c.conversion_type = 'click') AS clicks_total,
              (SELECT COUNT(*) FROM partner_conversions c WHERE c.partner_id = p.id AND c.conversion_type != 'click') AS conversions_total,
              (SELECT COALESCE(SUM(c.commission), 0) FROM partner_conversions c WHERE c.partner_id = p.id AND c.status != 'paid') AS commission_pending
       FROM partners p
       ORDER BY p.created_at DESC`,
    )
    res.json(rows)
  } catch (err) {
    logger.error('Admin partners list error:', err)
    res.json([])
  }
})

/**
 * @openapi
 * /api/admin/partners:
 *   post:
 *     tags: [Admin]
 *     summary: Create a partner
 */
router.post('/partners', async (req, res) => {
  const { name, type, affiliate_token: affiliateToken, commission_rate: commissionRate } = req.body || {}
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ message: 'Valid name is required' })
  }
  if (type && !['api', 'deeplink', 'saas'].includes(type)) {
    return res.status(400).json({ message: "type must be 'api' | 'deeplink' | 'saas'" })
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO partners (name, type, affiliate_token, commission_rate)
       VALUES (?, ?, ?, ?)`,
      [name.trim(), type || 'deeplink', affiliateToken || null, Number(commissionRate) > 0 ? Number(commissionRate) : 10],
    )
    res.status(201).json({ id: result.insertId })
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Partner with this name already exists' })
    }
    logger.error('Admin partner create error:', err)
    res.status(500).json({ message: 'Failed to create partner' })
  }
})

/**
 * @openapi
 * /api/admin/partners/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update partner (status/name/commission/type/token)
 */
router.put('/partners/:id', async (req, res) => {
  const { id } = req.params
  if (!/^\d+$/.test(id)) return res.status(400).json({ message: 'Invalid id' })
  const { name, type, status, affiliate_token: affiliateToken, commission_rate: commissionRate } = req.body || {}
  if (status && !['active', 'paused'].includes(status)) {
    return res.status(400).json({ message: "status must be 'active' or 'paused'" })
  }
  if (type && !['api', 'deeplink', 'saas'].includes(type)) {
    return res.status(400).json({ message: "type must be 'api' | 'deeplink' | 'saas'" })
  }
  try {
    const sets = []
    const params = []
    if (name !== undefined) { sets.push('name = ?'); params.push(String(name).trim()) }
    if (type !== undefined) { sets.push('type = ?'); params.push(type) }
    if (status !== undefined) { sets.push('status = ?'); params.push(status) }
    if (affiliateToken !== undefined) { sets.push('affiliate_token = ?'); params.push(affiliateToken) }
    if (commissionRate !== undefined) { sets.push('commission_rate = ?'); params.push(Number(commissionRate)) }
    if (!sets.length) return res.status(400).json({ message: 'Nothing to update' })
    params.push(id)
    const [result] = await pool.query(`UPDATE partners SET ${sets.join(', ')} WHERE id = ?`, params)
    if (!result.affectedRows) return res.status(404).json({ message: 'Partner not found' })
    res.json({ message: 'Partner updated' })
  } catch (err) {
    logger.error('Admin partner update error:', err)
    res.status(500).json({ message: 'Failed to update partner' })
  }
})

/**
 * @openapi
 * /api/admin/offers:
 *   get:
 *     tags: [Admin]
 *     summary: All partner offers with partner name
 */
router.get('/offers', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.id, o.partner_id, p.name AS partner_name, o.category, o.title,
              o.deeplink, o.city, o.price, o.placement, o.status,
              (SELECT COUNT(*) FROM partner_conversions c WHERE c.offer_id = o.id AND c.conversion_type = 'click') AS clicks_total
       FROM partner_offers o JOIN partners p ON p.id = o.partner_id
       ORDER BY o.created_at DESC`,
    )
    res.json(rows)
  } catch (err) {
    logger.error('Admin offers list error:', err)
    res.json([])
  }
})

/**
 * @openapi
 * /api/admin/partners/{id}/offers:
 *   post:
 *     tags: [Admin]
 *     summary: Create an offer for a partner
 */
router.post('/partners/:id/offers', async (req, res) => {
  const { id } = req.params
  if (!/^\d+$/.test(id)) return res.status(400).json({ message: 'Invalid id' })
  const { category, title, description, image_url: imageUrl, deeplink, price, city, valid_from: validFrom, valid_to: validTo, placement } = req.body || {}
  if (!OFFER_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: `category must be one of: ${OFFER_CATEGORIES.join(', ')}` })
  }
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return res.status(400).json({ message: 'Valid title is required' })
  }
  if (!deeplink || typeof deeplink !== 'string') {
    return res.status(400).json({ message: 'deeplink is required' })
  }
  const placements = String(placement || 'chat')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => PLACEMENTS.includes(s))
  if (!placements.length) {
    return res.status(400).json({ message: `placement must contain only: ${PLACEMENTS.join(', ')}` })
  }
  try {
    const [[partner]] = await pool.query('SELECT id FROM partners WHERE id = ? LIMIT 1', [id])
    if (!partner) return res.status(404).json({ message: 'Partner not found' })
    const [result] = await pool.query(
      `INSERT INTO partner_offers (partner_id, category, title, description, image_url, deeplink, price, city, valid_from, valid_to, placement)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, category, title.trim(), description || null, imageUrl || null, deeplink, price ? Number(price) : null, city || null, validFrom || null, validTo || null, placements.join(',')],
    )
    res.status(201).json({ id: result.insertId })
  } catch (err) {
    logger.error('Admin offer create error:', err)
    res.status(500).json({ message: 'Failed to create offer' })
  }
})

/**
 * @openapi
 * /api/admin/offers/{offerId}:
 *   put:
 *     tags: [Admin]
 *     summary: Update an offer (status/title/deeplink/etc.)
 */
router.put('/offers/:offerId', async (req, res) => {
  const { offerId } = req.params
  if (!/^\d+$/.test(offerId)) return res.status(400).json({ message: 'Invalid id' })
  const { title, description, deeplink, price, city, status, placement } = req.body || {}
  if (status && !['active', 'paused'].includes(status)) {
    return res.status(400).json({ message: "status must be 'active' or 'paused'" })
  }
  if (placement !== undefined) {
    const placements = String(placement).split(',').map((s) => s.trim()).filter((s) => PLACEMENTS.includes(s))
    if (!placements.length) return res.status(400).json({ message: 'Invalid placement set' })
  }
  try {
    const sets = []
    const params = []
    if (title !== undefined) { sets.push('title = ?'); params.push(String(title).trim()) }
    if (description !== undefined) { sets.push('description = ?'); params.push(description) }
    if (deeplink !== undefined) { sets.push('deeplink = ?'); params.push(deeplink) }
    if (price !== undefined) { sets.push('price = ?'); params.push(price === null ? null : Number(price)) }
    if (city !== undefined) { sets.push('city = ?'); params.push(city) }
    if (status !== undefined) { sets.push('status = ?'); params.push(status) }
    if (placement !== undefined) { sets.push('placement = ?'); params.push(String(placement).split(',').map((s) => s.trim()).filter((s) => PLACEMENTS.includes(s)).join(',')) }
    if (!sets.length) return res.status(400).json({ message: 'Nothing to update' })
    params.push(offerId)
    const [result] = await pool.query(`UPDATE partner_offers SET ${sets.join(', ')} WHERE id = ?`, params)
    if (!result.affectedRows) return res.status(404).json({ message: 'Offer not found' })
    res.json({ message: 'Offer updated' })
  } catch (err) {
    logger.error('Admin offer update error:', err)
    res.status(500).json({ message: 'Failed to update offer' })
  }
})

export default router
