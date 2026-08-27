import { spawn } from 'child_process'
import { mkdir, readdir, stat, unlink, writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, normalize, basename, resolve, sep, relative } from 'path'
import path from 'path'
import { fileURLToPath } from 'url'
import logger from './logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getBackupDir() {
  if (process.env.BACKUP_DIR) return resolve(process.env.BACKUP_DIR)
  return resolve(__dirname, '..', '..', 'backups')
}

function getRetentionDays() {
  const n = Number(process.env.BACKUP_RETENTION_DAYS)
  return Number.isFinite(n) && n > 0 ? n : 30
}

function detectMysqldumpPath() {
  const candidates = []
  if (process.env.MYSQLDUMP_PATH) candidates.push(process.env.MYSQLDUMP_PATH)
  if (process.platform === 'win32') {
    candidates.push(
      'C:\\laragon\\bin\\mysql\\mysql-8.4.3-winx64\\bin\\mysqldump.exe',
      'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump.exe',
      'C:\\laragon\\bin\\mysql\\mysql-8.0.28-winx64\\bin\\mysqldump.exe',
      `${process.env.ProgramFiles}\\MySQL\\MySQL Server 8.4\\bin\\mysqldump.exe`,
      `${process.env.ProgramFiles}\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe`,
    )
  }
  for (const c of candidates) {
    if (c && existsSync(c)) return c
  }
  return 'mysqldump'
}

function buildArgs() {
  const dbName = process.env.DB_NAME || 'swiftmatch'
  const args = [
    `-h${process.env.DB_HOST || 'localhost'}`,
    `-P${process.env.DB_PORT || 3306}`,
    `-u${process.env.DB_USER || 'root'}`,
  ]
  if (process.env.DB_PASSWORD) args.push(`-p${process.env.DB_PASSWORD}`)
  args.push(dbName, '--routines', '--triggers', '--single-transaction', '--default-character-set=utf8mb4')
  return args
}

function getUploadsDir() {
  return resolve(__dirname, '..', 'uploads')
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function writeU16(buf, offset, value) {
  buf[offset] = value & 0xff
  buf[offset + 1] = (value >>> 8) & 0xff
}

function writeU32(buf, offset, value) {
  buf[offset] = value & 0xff
  buf[offset + 1] = (value >>> 8) & 0xff
  buf[offset + 2] = (value >>> 16) & 0xff
  buf[offset + 3] = (value >>> 24) & 0xff
}

function buildZip(files) {
  const encoder = new TextEncoder()
  const chunks = []
  const central = []
  let offset = 0

  for (const { path, data } of files) {
    const name = encoder.encode(path)
    const crc = crc32(data)

    const local = Buffer.alloc(30 + name.length + data.length)
    writeU32(local, 0, 0x04034b50)
    writeU16(local, 4, 20)
    writeU16(local, 6, 0)
    writeU16(local, 8, 0)
    writeU32(local, 14, crc)
    writeU32(local, 18, data.length)
    writeU32(local, 22, data.length)
    writeU16(local, 26, name.length)
    writeU16(local, 28, 0)
    Buffer.from(name).copy(local, 30)
    data.copy(local, 30 + name.length)
    chunks.push(local)
    central.push({ name, crc, size: data.length, offset })
    offset += local.length
  }

  const centralStart = offset
  for (const c of central) {
    const entry = Buffer.alloc(46 + c.name.length)
    writeU32(entry, 0, 0x02014b50)
    writeU16(entry, 4, 20)
    writeU16(entry, 6, 20)
    writeU16(entry, 8, 0)
    writeU16(entry, 10, 0)
    writeU16(entry, 16, c.crc & 0xffff)
    writeU16(entry, 18, (c.crc >>> 16) & 0xffff)
    writeU32(entry, 20, c.size)
    writeU32(entry, 24, c.size)
    writeU16(entry, 28, c.name.length)
    writeU16(entry, 30, 0)
    writeU16(entry, 32, 0)
    writeU16(entry, 34, 0)
    writeU16(entry, 36, 0)
    writeU32(entry, 38, 0)
    writeU32(entry, 42, c.offset)
    Buffer.from(c.name).copy(entry, 46)
    chunks.push(entry)
  }

  const centralSize = offset - centralStart
  const eocd = Buffer.alloc(22)
  writeU32(eocd, 0, 0x06054b50)
  writeU16(eocd, 4, 0)
  writeU16(eocd, 6, 0)
  writeU16(eocd, 8, central.length)
  writeU16(eocd, 10, central.length)
  writeU32(eocd, 12, centralSize)
  writeU32(eocd, 16, centralStart)
  writeU16(eocd, 20, 0)
  chunks.push(eocd)

  return Buffer.concat(chunks)
}

async function collectUploadFiles(dir) {
  const files = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      const sub = await collectUploadFiles(full)
      files.push(...sub)
    } else if (entry.isFile()) {
      files.push(full)
    }
  }
  return files
}

export async function createFileBackup() {
  const dir = getBackupDir()
  await mkdir(dir, { recursive: true })

  const uploadsDir = getUploadsDir()
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `swiftmatch_files_${ts}.zip`
  const filepath = join(dir, filename)

  let files = []
  if (existsSync(uploadsDir)) {
    const raw = await collectUploadFiles(uploadsDir)
    for (const full of raw) {
      const rel = relative(uploadsDir, full).split(sep).join('/')
      files.push({ path: rel, data: await readFile(full) })
    }
  }

  const zip = buildZip(files)
  await writeFile(filepath, zip)

  logger.info(`File backup created (${files.length} files): ${filename}`)

  await pruneOldBackups()

  const st = await stat(filepath)
  return { name: filename, size: st.size, createdAt: st.mtime.toISOString() }
}

export async function listBackups() {
  const dir = getBackupDir()
  let entries = []
  try {
    entries = await readdir(dir)
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
  const files = []
  for (const name of entries) {
    if (!name.startsWith('swiftmatch_')) continue
    if (!name.endsWith('.sql') && !name.endsWith('.zip')) continue
    const full = join(dir, name)
    let st
    try {
      st = await stat(full)
    } catch {
      continue
    }
    if (!st.isFile()) continue
    files.push({ name, size: st.size, createdAt: st.mtime.toISOString() })
  }
  files.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return files
}

export async function createBackup() {
  const dir = getBackupDir()
  await mkdir(dir, { recursive: true })

  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `swiftmatch_${ts}.sql`
  const filepath = join(dir, filename)

  const mysqldump = detectMysqldumpPath()
  const startedAt = Date.now()

  await new Promise((resolveExec, rejectExec) => {
    const child = spawn(mysqldump, buildArgs(), { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    const out = []
    child.stdout.on('data', (c) => out.push(c))
    child.stderr.on('data', (c) => {
      stderr += c.toString()
    })
    child.on('error', (err) => {
      rejectExec(new Error(`mysqldump failed to start: ${err.message}`))
    })
    child.on('close', async (code) => {
      if (code !== 0) {
        rejectExec(new Error(`mysqldump exited with code ${code}: ${stderr.trim() || 'no stderr'}`))
        return
      }
      try {
        await writeFile(filepath, Buffer.concat(out))
        resolveExec()
      } catch (err) {
        rejectExec(err)
      }
    })
  })

  logger.info(`Backup created in ${Date.now() - startedAt}ms: ${filename}`)

  await pruneOldBackups()

  const st = await stat(filepath)
  return { name: filename, size: st.size, createdAt: st.mtime.toISOString() }
}

async function pruneOldBackups() {
  const dir = getBackupDir()
  const retention = getRetentionDays()
  const cutoff = Date.now() - retention * 24 * 60 * 60 * 1000
  const files = await listBackups()
  for (const f of files) {
    const created = Date.parse(f.createdAt)
    if (Number.isNaN(created) || created >= cutoff) continue
    try {
      await unlink(join(dir, f.name))
      logger.info(`Backup pruned: ${f.name}`)
    } catch (err) {
      logger.warn(`Failed to prune backup ${f.name}: ${err.message}`)
    }
  }
}

export function resolveBackupPath(name) {
  if (!name || typeof name !== 'string') return null
  const dir = getBackupDir()
  const clean = normalize(basename(name))
  if (!clean.startsWith('swiftmatch_')) return null
  const full = resolve(dir, clean)
  if (!full.startsWith(resolve(dir) + sep)) return null
  return full
}
