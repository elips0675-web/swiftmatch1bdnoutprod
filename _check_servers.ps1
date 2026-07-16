try {
  $r = Invoke-WebRequest -Uri "http://localhost:3002/health" -TimeoutSec 5 -UseBasicParsing
  Write-Output "API (3002): $($r.StatusCode) OK"
} catch { Write-Output "API (3002): NOT RESPONDING" }

try {
  $r = Invoke-WebRequest -Uri "http://localhost:8081" -TimeoutSec 5 -UseBasicParsing
  Write-Output "Frontend (8081): $($r.StatusCode) OK"
} catch { Write-Output "Frontend (8081): NOT RESPONDING" }
