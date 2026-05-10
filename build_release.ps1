$root    = $PSScriptRoot
$android = Join-Path $root "android"
$aabPath = Join-Path $android "app\build\outputs\bundle\release\app-release.aab"

Write-Host "=== FishingGO Release Build ===" -ForegroundColor Cyan

# Step 1: Apply icons (inline, not subprocess)
Write-Host "[1/5] Applying icons..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File (Join-Path $root "apply_icon.ps1")
Write-Host "[1/5] Icons done" -ForegroundColor Green

# Step 2: Delete old AAB
Write-Host "[2/5] Delete old AAB..." -ForegroundColor Yellow
if (Test-Path $aabPath) {
    Remove-Item -Force $aabPath
    Write-Host "  removed" -ForegroundColor Green
} else {
    Write-Host "  skip" -ForegroundColor Gray
}

# Step 3: Web build + cap sync (run from project root using full path)
Write-Host "[3/5] npm run build..." -ForegroundColor Yellow
$npmResult = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run build" -WorkingDirectory $root -Wait -PassThru -NoNewWindow
if ($npmResult.ExitCode -ne 0) {
    Write-Host "FAIL: npm build (exit $($npmResult.ExitCode))" -ForegroundColor Red
    exit 1
}
Write-Host "[3/5] build done" -ForegroundColor Green

Write-Host "[4/5] cap sync android..." -ForegroundColor Yellow
$capResult = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npx cap sync android" -WorkingDirectory $root -Wait -PassThru -NoNewWindow
if ($capResult.ExitCode -ne 0) {
    Write-Host "FAIL: cap sync (exit $($capResult.ExitCode))" -ForegroundColor Red
    exit 1
}
Write-Host "[4/5] sync done" -ForegroundColor Green

# Step 5: Gradle
Write-Host "[5/5] gradlew clean bundleRelease..." -ForegroundColor Yellow
$gradleResult = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "gradlew.bat clean bundleRelease" -WorkingDirectory $android -Wait -PassThru -NoNewWindow
if ($gradleResult.ExitCode -ne 0) {
    Write-Host "FAIL: gradle (exit $($gradleResult.ExitCode))" -ForegroundColor Red
    exit 1
}
Write-Host "[5/5] gradle done" -ForegroundColor Green

# Result
if (Test-Path $aabPath) {
    $info   = Get-Item $aabPath
    $sizeMB = [math]::Round($info.Length / 1MB, 2)
    Write-Host ""
    Write-Host "SUCCESS: app-release.aab ready!" -ForegroundColor Green
    Write-Host "  Size : ${sizeMB} MB"
    Write-Host "  Time : $($info.LastWriteTime)"
    Write-Host "  Path : $aabPath"
} else {
    Write-Host "FAIL: aab not found after build" -ForegroundColor Red
    exit 1
}
