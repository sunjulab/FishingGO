# FishingGO v1.4.3 AAB Auto Build Script
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
Set-Location $root

Write-Host "[1/5] node_modules check..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules\vite\bin\vite.js")) {
    Write-Host "  vite missing - reinstalling node_modules..." -ForegroundColor Red
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    }
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed!" -ForegroundColor Red; exit 1 }
} else {
    Write-Host "  node_modules OK" -ForegroundColor Green
}

Write-Host "[2/5] Vite (esbuild) build..." -ForegroundColor Yellow
npm run build:esbuild
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }
Write-Host "  Build OK" -ForegroundColor Green

Write-Host "[3/5] cap sync android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Host "cap sync failed!" -ForegroundColor Red; exit 1 }
Write-Host "  Sync OK" -ForegroundColor Green

Write-Host "[4/5] Gradle bundleRelease..." -ForegroundColor Yellow
Set-Location "$root\android"
.\gradlew.bat bundleRelease
if ($LASTEXITCODE -ne 0) { Write-Host "Gradle build failed!" -ForegroundColor Red; Set-Location $root; exit 1 }
Set-Location $root

Write-Host "[5/5] Done!" -ForegroundColor Yellow
$aab = "$root\android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aab) {
    $mb = [math]::Round((Get-Item $aab).Length / 1MB, 1)
    Write-Host ""
    Write-Host "SUCCESS: app-release.aab (${mb}MB)" -ForegroundColor Green
    Write-Host "Version: 1.4.3 (versionCode 11)" -ForegroundColor Cyan
    Write-Host "Path: $aab" -ForegroundColor Cyan
    explorer "$root\android\app\build\outputs\bundle\release"
} else {
    Write-Host "AAB not found!" -ForegroundColor Red
    exit 1
}
