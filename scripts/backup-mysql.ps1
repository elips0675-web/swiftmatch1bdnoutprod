param(
  [string]$DbName = "swiftmatch",
  [string]$DbUser = "root",
  [string]$DbPass = "",
  [string]$DbHost = "localhost",
  [int]$DbPort = 3306,
  [string]$BackupDir = "$PSScriptRoot\..\backups",
  [int]$RetentionDays = 7
)

# Auto-detect mysqldump
$mysqldumpPath = $null
$cmd = Get-Command "mysqldump.exe" -ErrorAction SilentlyContinue
if ($cmd) { $mysqldumpPath = $cmd.Source }

if (-not $mysqldumpPath) {
  $paths = @(
    "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqldump.exe",
    "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqldump.exe",
    "C:\laragon\bin\mysql\mysql-8.0.28-winx64\bin\mysqldump.exe",
    "${env:ProgramFiles}\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
    "${env:ProgramFiles}\MySQL\MySQL Server 8.4\bin\mysqldump.exe",
    "${env:ProgramFiles(x86)}\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
    "C:\xampp\mysql\bin\mysqldump.exe",
    "C:\wamp64\bin\mysql\mysql8.0\bin\mysqldump.exe"
  )
  foreach ($p in $paths) {
    if (Test-Path $p) { $mysqldumpPath = $p; break }
  }
}

if (-not $mysqldumpPath) {
  Write-Host "[backup] FAILED - mysqldump not found"
  exit 1
}

# Ensure backup dir
if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$filename = "swiftmatch_$timestamp.sql"
$filepath = Join-Path $BackupDir $filename

# Build connection args
$cred = "-h$DbHost -P$DbPort -u$DbUser"
if ($DbPass) { $cred += " -p$DbPass" }

Write-Host "[backup] $DbName -> $filepath"
Write-Host "[backup] $(Split-Path $mysqldumpPath -Leaf) at $mysqldumpPath"

# Run mysqldump via cmd /c to avoid PowerShell variable capture issues
$dumpCmd = "`"$mysqldumpPath`" $cred $DbName --routines --triggers --single-transaction"
cmd.exe /c "$dumpCmd > `"$filepath`"" 2>&1
if ($LASTEXITCODE -eq 0) {
  $size = (Get-Item $filepath).Length
  Write-Host "[backup] Done: $([math]::Round($size / 1MB, 2)) MB"
} else {
  Write-Host "[backup] FAILED (exit code $LASTEXITCODE)"
  exit $LASTEXITCODE
}

# Cleanup old backups
$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem $BackupDir -Filter "swiftmatch_*.sql" | Where-Object {
  $_.LastWriteTime -lt $cutoff
} | ForEach-Object {
  Remove-Item $_.FullName -Force
  Write-Host "[backup] Removed old: $($_.Name)"
}

Write-Host "[backup] Retention: $RetentionDays days"
