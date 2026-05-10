$root    = $PSScriptRoot
$android = Join-Path $root "android"
$aabPath = Join-Path $android "app\build\outputs\bundle\release\app-release.aab"

Write-Host "=== FishingGO Release Build ===" -ForegroundColor Cyan

# Step 1: Apply icons
Write-Host "[1/6] Applying icons..." -ForegroundColor Yellow
& powershell -ExecutionPolicy Bypass -File (Join-Path $root "apply_icon.ps1")
if ($LASTEXITCODE -ne 0) { Write-Host "FAIL: icon apply" -ForegroundColor Red; exit 1 }

# Step 2: Delete old AAB
Write-Host "[2/6] Delete old AAB..." -ForegroundColor Yellow
if (Test-Path $aabPath) {
    Remove-Item -Force $aabPath
    Write-Host "  OK - removed" -ForegroundColor Green
} else {
    Write-Host "  SKIP" -ForegroundColor Gray
}

# Step 3: Web build
Write-Host "[3/6] npm run build..." -ForegroundColor Yellow
Push-Location $root
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "FAIL: npm build" -ForegroundColor Red; Pop-Location; exit 1 }
Write-Host "  OK" -ForegroundColor Green

# Step 4: Cap sync
Write-Host "[4/6] cap sync android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Host "FAIL: cap sync" -ForegroundColor Red; Pop-Location; exit 1 }
Write-Host "  OK" -ForegroundColor Green
Pop-Location

# Step 5: Gradle build
Write-Host "[5/6] gradlew clean bundleRelease..." -ForegroundColor Yellow
Push-Location $android
cmd /c "gradlew.bat clean bundleRelease"
if ($LASTEXITCODE -ne 0) { Write-Host "FAIL: gradle" -ForegroundColor Red; Pop-Location; exit 1 }
Write-Host "  OK" -ForegroundColor Green
Pop-Location

# Step 6: Result
Write-Host "[6/6] Result check..." -ForegroundColor Yellow
if (Test-Path $aabPath) {
    $info   = Get-Item $aabPath
    $sizeMB = [math]::Round($info.Length / 1MB, 2)
    Write-Host ""
    Write-Host "SUCCESS: app-release.aab v1.4.1(9) ready!" -ForegroundColor Green
    Write-Host "  Size : ${sizeMB} MB"
    Write-Host "  Time : $($info.LastWriteTime)"
    Write-Host "  Path : $aabPath"
} else {
    Write-Host "FAIL: aab not found" -ForegroundColor Red
    exit 1
}
