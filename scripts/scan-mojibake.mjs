import mysql from 'mysql2/promise'
const pool = await mysql.createPool({
  host: '127.0.0.1', user: 'root', database: 'swiftmatch',
  charset: 'utf8mb4',
})
const isMoji = (s) => {
  if (!s) return false
  return /[\u2560-\u259F]/.test(s) || s.includes('\u00E2\u0095') || s.includes('\u00C3\u0090') || s.includes('\u00C3\u0091')
}
const checks = [
  ['messages', 'text'],
  ['user_profiles', 'display_name'],
  ['chat_groups', 'name_ru'],
  ['group_categories', 'name_ru'],
  ['icebreaker_questions', 'text_ru'],
  ['experiments', 'name'],
  ['experiments', 'description'],
]
let bad = 0
for (const [table, col] of checks) {
  try {
    const [rows] = await pool.query(`SELECT id, ${col} AS v FROM ${table}`)
    const hits = rows.filter((r) => isMoji(r.v))
    if (hits.length === 0) {
      console.log(`OK   ${table}.${col}`)
    } else {
      bad += hits.length
      console.log(`MOJI ${table}.${col}: ${hits.length}/${rows.length}`)
      for (const r of hits.slice(0, 3)) console.log(`     id=${r.id} first=${JSON.stringify(String(r.v).slice(0, 40))}`)
    }
  } catch (e) {
    console.log(`SKIP ${table}.${col}: ${e.code || e.message}`)
  }
}
console.log(bad === 0 ? 'ALL CLEAN' : `TOTAL BAD: ${bad}`)
await pool.end()