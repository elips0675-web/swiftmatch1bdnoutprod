import { readFileSync } from 'fs'
import { readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'swiftmatch',
    multipleStatements: true,
  })

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const [rows] = await connection.execute('SELECT name FROM _migrations ORDER BY name')
  const applied = new Set(rows.map(r => r.name))

  const files = (await readdir(__dirname))
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate] SKIP ${file} (already applied)`)
      continue
    }

    const sql = readFileSync(join(__dirname, file), 'utf8')
    console.log(`[migrate] APPLY ${file}...`)

    await connection.query(sql)
    await connection.execute('INSERT INTO _migrations (name) VALUES (?)', [file])

    console.log(`[migrate] DONE ${file}`)
  }

  await connection.end()
  console.log('[migrate] All migrations applied')
}

migrate().catch(err => {
  console.error('[migrate] FAILED:', err.message)
  process.exit(1)
})
