#!/usr/bin/env bash
# SwiftMatch — инициализация БД на Linux (staging/prod)
# Использование: ./setup-db.sh
# Создаёт БД swiftmatch (utf8mb4), импортирует database/mysql_schema.sql,
# создаёт админа admin@swiftmatch.com.
# Пароль root задаётся env DB_PASSWORD (или MYSQL_PWD), по умолчанию — без пароля.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DB_NAME="${DB_NAME:-swiftmatch}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@swiftmatch.com}"
ADMIN_PASSWORD_HASH='$2a$10$8KzQMGx5C5Kc5Q5Q5Q5Q5e'

MYSQL="${MYSQL:-mysql}"
MYSQL_ARGS=(-u "$DB_USER")
if [ -n "$DB_PASSWORD" ]; then
  MYSQL_ARGS+=(-p"$DB_PASSWORD")
fi

log() {
  local lvl="$1"; shift
  case "$lvl" in
    ok)   printf '\033[0;32m[OK]\033[0m %s\n' "$*" ;;
    info) printf '\033[0;34m[...]\033[0m %s\n' "$*" ;;
    warn) printf '\033[0;33m[!]\033[0m %s\n' "$*" >&2 ;;
    err)  printf '\033[0;31m[ERR]\033[0m %s\n' "$*" >&2 ;;
  esac
}

fail() {
  log err "$@" >&2
  exit 1
}

if ! command -v "$MYSQL" >/dev/null 2>&1; then
  fail "mysql-клиент не найден в PATH ($MYSQL). Установите MySQL/MariaDB или укажите MYSQL=путь"
fi
if ! "$MYSQL" "${MYSQL_ARGS[@]}" -e "SELECT 1" >/dev/null 2>&1; then
  fail "MySQL не отвечает. Запустите сервис (systemctl start mysql/mariadb) или проверьте DB_USER/DB_PASSWORD"
fi

log info "[1/3] Создание базы ${DB_NAME} (utf8mb4)..."
"$MYSQL" "${MYSQL_ARGS[@]}" -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
log ok "База создана"

log info "[2/3] Импорт схемы (database/mysql_schema.sql)..."
if [ ! -f "database/mysql_schema.sql" ]; then
  fail "Не найден database/mysql_schema.sql"
fi
"$MYSQL" "${MYSQL_ARGS[@]}" "$DB_NAME" < "database/mysql_schema.sql"
log ok "Схема импортирована"

log info "[3/3] Создание админа (${ADMIN_EMAIL})..."
"$MYSQL" "${MYSQL_ARGS[@]}" "$DB_NAME" -e \
  "INSERT IGNORE INTO users (id, email, password_hash, role) VALUES (1, '${ADMIN_EMAIL}', '${ADMIN_PASSWORD_HASH}', 'admin');"
log ok "Админ готов"

log ok "Готово! База ${DB_NAME}, пользователь: ${ADMIN_EMAIL}"
log info "Запуск сервера: (cd server && node src/index.js)  |  Админка: http://localhost:3002/api/admin/me"
