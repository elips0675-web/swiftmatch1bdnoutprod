param(
  [string]$DbUser = "root",
  [string]$DbPass = "",
  [string]$DbHost = "localhost",
  [int]$DbPort = 3306,
  [string]$BackupDir = "$PSScriptRoot\..\backups",
  [string]$VerifyDb = "swiftmatch_verify"
)

$ErrorActionPreference = "Stop"

function Find-MysqlBin([string]$name) {
  $cmd = Get-Command "$name.exe" -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $paths = @(
    "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\$name.exe",
    "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\$name.exe",
    "${env:ProgramFiles}\MySQL\MySQL Server 8.4\bin\$name.exe",
    "${env:ProgramFiles}\MySQL\MySQL Server 8.0\bin\$name.exe",
    "C:\xampp\mysql\bin\$name.exe"
  )
  foreach ($p in $paths) { if (Test-Path $p) { return $p } }
  return $null
}

$mysql = Find-MysqlBin "mysql"
if (-not $mysql) { Write-Host "[verify] FAILED - mysql.exe not found"; exit 1 }

$backup = Get-ChildItem $BackupDir -Filter "swiftmatch_*.sql" -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $backup) { Write-Host "[verify] FAILED - no backups in $BackupDir"; exit 1 }

Write-Host "[verify] Backup: $($backup.Name) ($([math]::Round($backup.Length / 1MB, 2)) MB)"
Write-Host "[verify] Restoring into scratch DB '$VerifyDb'..."

$cred = "-h$DbHost -P$DbPort -u$DbUser"
if ($DbPass) { $cred += " -p$DbPass" }

# Drop + recreate scratch DB
cmd.exe /c "`"$mysql`" $cred -e `"DROP DATABASE IF EXISTS $VerifyDb; CREATE DATABASE $VerifyDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`"" 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host "[verify] FAILED - cannot create scratch DB"; exit 1 }

# Restore dump into scratch DB
cmd.exe /c "`"$mysql`" $cred $VerifyDb < `"$($backup.FullName)`"" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "[verify] FAILED - restore error (exit $LASTEXITCODE)"
  cmd.exe /c "`"$mysql`" $cred -e `"DROP DATABASE IF EXISTS $VerifyDb;`"" 2>$null
  exit 1
}

# Sanity checks
$checks = @("users", "user_profiles", "matches", "messages", "subscriptions", "feature_flags")
$fail = $false
foreach ($t in $checks) {
  $out = cmd.exe /c "`"$mysql`" $cred -N -e `"SELECT COUNT(*) FROM $VerifyDb.$t;`"" 2>&1
  $cnt = ($out | Select-Object -Last 1).Trim()
  if ($cnt -match "^\d+$") {
    Write-Host ("  [OK] {0}: {1} rows" -f $t, $cnt)
  } else {
    Write-Host ("  [FAIL] {0}: {1}" -f $t, $cnt)
    $fail = $true
  }
}

# Cleanup scratch DB
cmd.exe /c "`"$mysql`" $cred -e `"DROP DATABASE IF EXISTS $VerifyDb;`"" 2>$null

if ($fail) { Write-Host "[verify] FAILED - sanity checks did not pass"; exit 1 }
Write-Host "[verify] PASS - backup restores cleanly, scratch DB dropped"