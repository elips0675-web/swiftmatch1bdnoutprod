#!/usr/bin/env bash
# SwiftMatch — запуск всех сервисов на Linux (staging/prod)
# Использование: ./запуск-всего.sh   (или bash запуск-всего.sh)
# Запускает: MySQL (опц.), API (http://localhost:3002), Frontend (http://localhost:8081)

set -euo pipefail

# Каталог проекта: каталог, где лежит этот скрипт
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

API_PORT="${API_PORT:-3002}"
FRONT_PORT="${FRONT_PORT:-8081}"
MYSQL_START="${MYSQL_START:-1}"

log() {
  local lvl="$1"; shift
  case "$lvl" in
    ok)   printf '\033[0;32m[OK]\033[0m %s\n' "$*" ;;
    info) printf '\033[0;34m[...]\033[0m %s\n' "$*" ;;
    warn) printf '\033[0;33m[!]\033[0m %s\n' "$*" >&2 ;;
    err)  printf '\033[0;31m[ERR]\033[0m %s\n' "$*" >&2 ;;
  esac
}

# Убить на выходе (SIGINT/SIGTERM)
PIDS=()
cleanup() {
  log warn "Останавливаю сервисы..."
  for p in "${PIDS[@]:-}"; do
    kill "$p" 2>/dev/null || true
  done
  exit 0
}
trap cleanup INT TERM

# 1/3 MySQL
if [ "$MYSQL_START" = "1" ]; then
  if command -v systemctl >/dev/null 2>&1 && systemctl is-active mysql >/dev/null 2>&1; then
    log ok "MySQL уже запущен (systemd)"
  elif command -v mysqladmin >/dev/null 2>&1 && mysqladmin ping --silent 2>/dev/null; then
    log ok "MySQL уже отвечает"
  else
    log info "Запускаю MySQL..."
    if command -v service >/dev/null 2>&1 && (service mysql start || service mariadb start); then
      log ok "MySQL запущен через service"
    elif command -v mysqld >/dev/null 2>&1; then
      mysqld >/dev/null 2>&1 &
      PIDS+=($!)
      log ok "MySQL запущен (mysqld, pid ${PIDS[-1]})"
    else
      log warn "mysqld не найдён — считаю MySQL уже запущенным извне"
    fi
    sleep 2
  fi
else
  log info "MYSQL_START=0 — пропускаю MySQL"
fi

# 2/3 API
log info "Запускаю API на http://localhost:${API_PORT}..."
(cd server && node src/index.js) &
PIDS+=($!)
log ok "API pid ${PIDS[-1]}"

# 3/3 Frontend
log info "Запускаю Frontend на http://localhost:${FRONT_PORT}..."
npx vite --port "$FRONT_PORT" --host &
PIDS+=($!)
log ok "Frontend pid ${PIDS[-1]}"

log ok "MySQL — 3306; API — http://localhost:${API_PORT}; Front — http://localhost:${FRONT_PORT}"
log info "Ctrl+C для остановки всех сервисов"
wait
