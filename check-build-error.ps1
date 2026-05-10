$ErrorActionPreference = "Continue"
$root = $PSScriptRoot
Set-Location $root

Write-Host "[BUILD] npm run build (full output)..." -ForegroundColor Yellow
$output = npm run build 2>&1
$output | Out-String | Write-Host

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n=== BUILD FAILED. Error lines: ===" -ForegroundColor Red
    $output | Where-Object { $_ -match "error|Error|failed|Failed|warn" } | ForEach-Object { Write-Host $_ -ForegroundColor Red }
}
