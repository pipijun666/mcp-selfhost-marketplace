$ErrorActionPreference = 'Stop'
$health = 'http://127.0.0.1:18080/healthz'
Write-Host '=== MCP Selfhost v0.2 local health ==='
$listener = Get-NetTCPConnection -LocalPort 18080 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  $listener | Select-Object LocalAddress,LocalPort,OwningProcess
} else {
  Write-Host 'PORT_18080_NOT_LISTENING'
  exit 2
}
Write-Host '=== Identity ==='
try {
  $r = Invoke-RestMethod -Uri $health -Method Get -TimeoutSec 10
  $r | ConvertTo-Json -Depth 5
  if ($r.marker -ne 'SELFHOST_E2E_OK') {
    throw "Unexpected identity marker: $($r.marker)"
  }
  Write-Host 'SELFHOST_IDENTITY_OK'
} catch {
  Write-Host "SELFHOST_HEALTH_ERROR=$($_.Exception.Message)"
  exit 3
}
