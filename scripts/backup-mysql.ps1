param(
  [string]$DbName = "swiftmatch",
  [string]$DbUser = "root",
  [string]$DbPass = "",
  [string]$DbHost = "localhost",
  [int]$DbPort = 3306,
  [string]$BackupDir = "$PSScriptRoot\..\backups",
  [int]$RetentionDays = 7
)

if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$filename = "swiftmatch_$timestamp.sql"
$filepath = Join-Path $BackupDir $filename

$conn = "-h$DbHost -P$DbPort -u$DbUser"
if ($DbPass) { $conn += " -p$DbPass" }

Write-Host "[backup] Starting backup of $DbName → $filepath"

$proc = Start-Process -FilePath "mysqldump" -ArgumentList "$conn $DbName --routines --triggers --single-transaction --result-file=$filepath" -NoNewWindow -Wait -PassThru

if ($proc.ExitCode -eq 0) {
  $size = (Get-Item $filepath).Length
  Write-Host "[backup] Done: $([math]::Round($size / 1MB, 2)) MB"
} else {
  Write-Host "[backup] FAILED (exit code $($proc.ExitCode))" -ForegroundColor Red
  exit $proc.ExitCode
}

# Cleanup old backups
Get-ChildItem $BackupDir -Filter "swiftmatch_*.sql" | Where-Object {
  $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays)
} | ForEach-Object {
  Remove-Item $_.FullName -Force
  Write-Host "[backup] Removed old: $($_.Name)"
}

Write-Host "[backup] Retention: $RetentionDays days"
