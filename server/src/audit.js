import pool from './db.js'

export async function auditLog({ tableName, recordId, action, oldValues, newValues, userId, ipAddress }) {
  try {
    await pool.query(
      'INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tableName, recordId, action, oldValues ? JSON.stringify(oldValues) : null, newValues ? JSON.stringify(newValues) : null, userId || null, ipAddress || null],
    )
  } catch (err) {
    console.error('Audit log error:', err.message)
  }
}

export async function softDelete(tableName, id, userId, ipAddress) {
  await pool.query(`UPDATE \`${tableName}\` SET deleted_at = NOW() WHERE id = ?`, [id])
  await auditLog({ tableName, recordId: id, action: 'delete', userId, ipAddress })
}

export async function softDeleteWhere(tableName, whereClause, params, userId, ipAddress) {
  await pool.query(`UPDATE \`${tableName}\` SET deleted_at = NOW() WHERE ${whereClause}`, params)
}
