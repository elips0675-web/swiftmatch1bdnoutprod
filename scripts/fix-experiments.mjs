import mysql from 'mysql2/promise'
const pool = await mysql.createPool({
  host: '127.0.0.1', user: 'root', database: 'swiftmatch',
  charset: 'utf8mb4',
})
await pool.query(
  `UPDATE experiments
   SET name = ?, description = ?
   WHERE experiment_key = 'card_cta'`,
  ['CTA на карточке', 'Variant B — доп. кнопка «Открыть профиль» на карточке свайпа'],
)
const [rows] = await pool.query(`SELECT id, name, description FROM experiments`)
console.log(JSON.stringify(rows, null, 2))
await pool.end()