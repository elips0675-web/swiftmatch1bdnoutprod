const fs = require('fs')
const content = fs.readFileSync('src/lib/demo-data.ts', 'utf8')
const catRe = /id: '(\w+)', name_ru: '([^']+)', name_en: '([^']+)', icon: '(\w+)', img: '([^']+)'(?:, hint: '([^']*)')?,\s*subgroups: \[([\s\S]*?)\]/g
let m, catIdx = 0
const catsSql = []
const groupsSql = []
const rows = []
while ((m = catRe.exec(content)) !== null) {
  catIdx++
  const hint = m[6] ? "'" + m[6] + "'" : 'NULL'
  catsSql.push(`(${catIdx}, '${m[2]}', '${m[3]}', '${m[4]}', '${m[5]}', ${hint}, ${catIdx})`)
  const subs = [...m[7].matchAll(/{ id: (\d+), name_ru: '([^']+)', name_en: '([^']+)', members: (\d+), online: (\d+)(?:, href: '([^']+)')?/g)]
  for (const s of subs) {
    const href = s[6] ? "'" + s[6] + "'" : 'NULL'
    groupsSql.push(`(${s[1]}, ${catIdx}, '${s[2]}', '${s[3]}', NULL, NULL, ${s[4]}, ${s[5]}, ${href})`)
  }
  rows.push([m[1], catIdx, subs.length])
}
console.log('parsed categories:', rows.map(r => `${r[0]}=${r[2]}`).join(', '))
const sql = `-- Seed groups from demo-data.ts
INSERT INTO group_categories (id, name_ru, name_en, icon, img, hint, sort_order) VALUES
${catsSql.join(',\n')};

INSERT INTO chat_groups (id, category_id, name_ru, name_en, description, img, members_count, online_count, href) VALUES
${groupsSql.join(',\n')};
`
fs.writeFileSync('database/demo_groups.sql', sql)
console.log('written database/demo_groups.sql, groups:', groupsSql.length)