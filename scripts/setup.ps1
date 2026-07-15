param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"
Write-Host "=== SwiftMatch Dev Setup ===" -ForegroundColor Cyan

# ── Server .env ──────────────────────────────────────────
$serverEnv = "server\.env"
if ((Test-Path $serverEnv) -and -not $Force) {
  Write-Host "[skip] $serverEnv already exists (use -Force to overwrite)" -ForegroundColor Yellow
} else {
  Copy-Item "server\.env.example" $serverEnv -Force
  $jwt = node -e "const c=require('crypto');console.log(c.randomBytes(32).toString('hex'))"
  (Get-Content $serverEnv) -replace 'JWT_SECRET=.*', "JWT_SECRET=$jwt" | Set-Content $serverEnv
  Write-Host "[ok] $serverEnv created with random JWT_SECRET" -ForegroundColor Green
}

# ── Frontend .env ────────────────────────────────────────
$feEnv = ".env"
if ((Test-Path $feEnv) -and -not $Force) {
  Write-Host "[skip] $feEnv already exists (use -Force to overwrite)" -ForegroundColor Yellow
} else {
  Copy-Item ".env.example" $feEnv -Force
  Write-Host "[ok] $feEnv created" -ForegroundColor Green
}

# ── npm install (frontend) ───────────────────────────────
if (-not (Test-Path "node_modules\.package-lock.json")) {
  Write-Host "[...] npm install (frontend)..." -NoNewline
  npm install --silent 2>$null
  Write-Host " done" -ForegroundColor Green
} else {
  Write-Host "[skip] node_modules already exists" -ForegroundColor Yellow
}

# ── npm install (server) ─────────────────────────────────
if (-not (Test-Path "server\node_modules\.package-lock.json")) {
  Write-Host "[...] npm install (server)..." -NoNewline
  cd server; npm install --silent 2>$null; cd ..
  Write-Host " done" -ForegroundColor Green
} else {
  Write-Host "[skip] server/node_modules already exists" -ForegroundColor Yellow
}

# ── Verify ───────────────────────────────────────────────
Write-Host ""
Write-Host "=== Verify ===" -ForegroundColor Cyan
Write-Host "  1. Start MySQL (Laragon or mysqld)"
Write-Host "  2. cd server && node src\index.js   # API on :3002"
Write-Host "  3. npx vite --port 8081 --host     # Frontend on :8081"
Write-Host "  4. For production, fill secrets in $serverEnv:"
Write-Host "     - STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET"
Write-Host "     - SMTP_USER / SMTP_PASS"
Write-Host "     - SENTRY_DSN"
Write-Host "     - REDIS_URL"
Write-Host "     - AWS_* + S3_BUCKET"
Write-Host "     - DB_PASSWORD"
Write-Host "     - CORS_ORIGIN"
Write-Host "=== Done ===" -ForegroundColor Cyan
