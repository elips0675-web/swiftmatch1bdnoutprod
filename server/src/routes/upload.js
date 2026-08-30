import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import pool from '../db.js'
import { auth, optionalAuth } from '../middleware.js'
import logger from '../logger.js'
import { processImage } from '../image-pipeline.js'
import { moderateImage } from '../ai-moderation.js'
import { createBreaker } from '../circuit-breaker.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads')

let storage
const USE_S3 = process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID

const s3DeleteBreaker = USE_S3
  ? createBreaker(async (s3, key) => {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }))
    }, 's3-delete-object', { timeout: 8000 })
  : null

async function initStorage() {
  if (storage) return storage

  if (USE_S3) {
    const { S3Client } = await import('@aws-sdk/client-s3')
    const multerS3 = (await import('multer-s3')).default
    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
    storage = multerS3({
      s3,
      bucket: process.env.S3_BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'uploads/' + unique + path.extname(file.originalname))
      },
    })
  } else {
    storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOAD_DIR),
      filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, unique + path.extname(file.originalname))
      },
    })
  }
  return storage
}

const router = Router()

let uploadMiddleware

async function getUpload() {
  if (!uploadMiddleware) {
    const s = await initStorage()
    uploadMiddleware = multer({
      storage: s,
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files (jpg, jpeg, png, gif, webp) are allowed'))
        }
        const allowed = /\.(jpg|jpeg|png|gif|webp)$/i
        if (allowed.test(path.extname(file.originalname))) return cb(null, true)
        cb(new Error('Only image files (jpg, jpeg, png, gif, webp) are allowed'))
      },
    })
  }
  return uploadMiddleware.single('photo')
}

router.post('/api/upload', optionalAuth, async (req, res) => {
  try {
    const single = await getUpload()
    await new Promise((resolve, reject) => {
      single(req, res, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    if (!req.userId && !req.body.user_id) {
      return res.status(401).json({ message: 'Authentication required' })
    }
    const userId = req.userId || req.body.user_id
    const sortOrder = req.body.sort_order || 0
    const url = `/uploads/${req.file.filename}`

    // Process image with Sharp (resize + WebP)
    if (req.file.path) {
      processImage(req.file.path).catch((err) => {
        logger.error('Image pipeline error:', err)
      })
    }

    const [result] = await pool.query(
      'INSERT INTO user_photos (user_id, url, sort_order) VALUES (?, ?, ?)',
      [userId, url, parseInt(sortOrder)],
    )
    const photoId = result.insertId

    // AI Moderation check
    if (req.file.path) {
      moderateImage(req.file.path).then((modResult) => {
        if (!modResult.safe) {
          pool.query(
            "UPDATE user_photos SET moderation_status = 'flagged', moderation_reason = ? WHERE id = ?",
            [modResult.reasons.join(', '), photoId],
          ).catch((e) => logger.error('AI moderation update failed:', e))
          logger.warn(`Photo ${photoId} flagged by AI: ${modResult.reasons.join(', ')}`)
        } else {
          pool.query(
            "UPDATE user_photos SET moderation_status = 'approved' WHERE id = ?",
            [photoId],
          ).catch((e) => logger.error('AI moderation approve failed:', e))
        }
      }).catch((err) => {
        logger.error('AI moderation error:', err)
      })
    }

    res.json({
      id: photoId,
      url,
      sort_order: parseInt(sortOrder),
      is_avatar: false,
    })
  } catch (err) {
    logger.error('Upload error:', err)
    res.status(500).json({ message: 'Upload failed' })
  }
})

router.delete('/api/photos/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT url FROM user_photos WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'Photo not found' })

    if (USE_S3) {
      const { S3Client } = await import('@aws-sdk/client-s3')
      const s3 = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      })
      const key = rows[0].url.replace('/uploads/', 'uploads/')
      if (s3DeleteBreaker) {
        await s3DeleteBreaker.fire(s3, key).catch((err) => {
          logger.warn('S3 delete failed (photo removed from DB, orphan object may remain):', err?.message || err)
        })
      }
    } else {
      const filePath = path.join(UPLOAD_DIR, path.basename(rows[0].url))
      try { fs.unlinkSync(filePath) } catch {}
    }

    await pool.query('DELETE FROM user_photos WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    logger.error('Delete photo error:', err)
    res.status(500).json({ message: 'Delete failed' })
  }
})

router.get('/api/photos/:userId', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, url, sort_order, is_avatar FROM user_photos WHERE user_id = ? ORDER BY sort_order',
      [req.params.userId],
    )
    res.json(rows)
  } catch (err) {
    logger.error('Photos GET error:', err)
    res.status(500).json({ message: 'Failed to fetch photos' })
  }
})

export default router
