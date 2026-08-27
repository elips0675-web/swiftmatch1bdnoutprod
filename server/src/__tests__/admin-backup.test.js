import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'
import { writeFileSync, mkdtempSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('../logger.js', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

const backupMocks = vi.hoisted(() => ({
  listBackups: vi.fn(),
  createBackup: vi.fn(),
  resolveBackupPath: vi.fn(),
}))

vi.mock('../backup.js', () => backupMocks)

import adminBackup from '../routes/admin/backup.js'

const JWT_SECRET = 'change-me-in-production'

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/admin', (req, res, next) => {
    req.admin = { id: 1, userId: 1, role: 'admin' }
    next()
  })
  app.use('/api/admin', adminBackup)
  return app
}

function adminToken() {
  return jwt.sign({ userId: 1, id: 1, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' })
}

const app = createApp()

const sample = { name: 'swiftmatch_2026-08-27T00-00-00-000Z.sql', size: 1234, createdAt: '2026-08-27T00:00:00.000Z' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('admin backup route', () => {
  it('POST / creates a backup and returns 201', async () => {
    backupMocks.createBackup.mockResolvedValue(sample)
    const res = await request(app)
      .post('/api/admin/backup')
      .set('Authorization', `Bearer ${adminToken()}`)

    expect(res.status).toBe(201)
    expect(res.body).toEqual(sample)
  })

  it('POST / returns 500 with BACKUP_MYSQLDUMP_NOT_AVAILABLE when mysqldump is missing', async () => {
    backupMocks.createBackup.mockRejectedValue(new Error('mysqldump failed to start: ENOENT'))
    const res = await request(app)
      .post('/api/admin/backup')
      .set('Authorization', `Bearer ${adminToken()}`)

    expect(res.status).toBe(500)
    expect(res.body.message).toBe('BACKUP_MYSQLDUMP_NOT_AVAILABLE')
  })

  it('GET / lists backups as an array', async () => {
    backupMocks.listBackups.mockResolvedValue([sample])
    const res = await request(app)
      .get('/api/admin/backup')
      .set('Authorization', `Bearer ${adminToken()}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].name).toBe(sample.name)
  })

  it('GET / returns 500 with a message on list failure', async () => {
    backupMocks.listBackups.mockRejectedValue(new Error('boom'))
    const res = await request(app)
      .get('/api/admin/backup')
      .set('Authorization', `Bearer ${adminToken()}`)

    expect(res.status).toBe(500)
    expect(res.body.message).toBe('Failed to list backups')
  })

  it('GET /:name/download returns 400 for a path traversal attempt', async () => {
    backupMocks.resolveBackupPath.mockReturnValue(null)
    const res = await request(app)
      .get('/api/admin/backup/..%2F..%2Fetc%2Fpasswd/download')
      .set('Authorization', `Bearer ${adminToken()}`)

    expect(res.status).toBe(400)
  })

  it('GET /:name/download returns 404 when file does not exist', async () => {
    backupMocks.resolveBackupPath.mockReturnValue(join(tmpdir(), 'nonexistent.sql'))
    const res = await request(app)
      .get('/api/admin/backup/swiftmatch_nope.sql/download')
      .set('Authorization', `Bearer ${adminToken()}`)

    expect(res.status).toBe(404)
  })

  it('GET /:name/download streams the backup file with attachment header', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bkt-'))
    const file = join(dir, 'swiftmatch_2026-08-27T00-00-00-000Z.sql')
    writeFileSync(file, 'CREATE TABLE users (id INT);')
    backupMocks.resolveBackupPath.mockReturnValue(file)

    const res = await request(app)
      .get(`/api/admin/backup/${encodeURIComponent('swiftmatch_2026-08-27T00-00-00-000Z.sql')}/download`)
      .set('Authorization', `Bearer ${adminToken()}`)

    expect(res.status).toBe(200)
    expect(res.headers['content-disposition']).toContain('attachment')
    expect(res.text).toContain('CREATE TABLE users')
    expect(existsSync(dir)).toBe(true)
  })
})
