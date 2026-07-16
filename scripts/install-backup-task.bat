@echo off
REM Run this file as Administrator to install the daily MySQL backup task
schtasks /create /tn "SwiftMatch-DB-Backup" /tr "powershell.exe -ExecutionPolicy Bypass -File \"%~dp0backup-mysql.ps1\" -DbName swiftmatch -DbUser root" /sc daily /st 03:00 /ru SYSTEM /rl HIGHEST /f
if %errorlevel% equ 0 (
    echo [OK] Scheduled task 'SwiftMatch-DB-Backup' created (daily at 3:00 AM)
) else (
    echo [FAIL] Could not create task. Run this .bat as Administrator.
)
pause
