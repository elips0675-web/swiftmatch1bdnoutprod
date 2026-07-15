#!/usr/bin/env bash
# MySQL backup script for SwiftMatch
# Usage: ./scripts/backup-mysql.sh [db_name] [db_user] [db_password]
# Scheduled via cron: 0 3 * * * /path/to/scripts/backup-mysql.sh swiftmatch root "" >> /var/log/swiftmatch-backup.log 2>&1

set -euo pipefail

DB_NAME="${1:-swiftmatch}"
DB_USER="${2:-root}"
DB_PASS="${3:-}"
DB_HOST="${4:-localhost}"
DB_PORT="${5:-3306}"
BACKUP_DIR="${6:-$(dirname "$0")/../backups}"
RETENTION_DAYS="${7:-7}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
FILENAME="swiftmatch_${TIMESTAMP}.sql"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "[backup] Starting backup of ${DB_NAME} → ${FILEPATH}"

MYSQLDUMP_ARGS="-h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER}"
if [ -n "$DB_PASS" ]; then
  MYSQLDUMP_ARGS="${MYSQLDUMP_ARGS} -p${DB_PASS}"
fi

if mysqldump ${MYSQLDUMP_ARGS} "${DB_NAME}" --routines --triggers --single-transaction > "$FILEPATH"; then
  SIZE=$(du -h "$FILEPATH" | cut -f1)
  echo "[backup] Done: ${SIZE}"
else
  echo "[backup] FAILED" >&2
  exit 1
fi

# Cleanup old backups
find "$BACKUP_DIR" -name "swiftmatch_*.sql" -mtime +${RETENTION_DAYS} -delete
echo "[backup] Retention: ${RETENTION_DAYS} days"
