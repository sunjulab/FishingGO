@echo off
cd /d "%~dp0"

echo [PREP] Removing conflicting files...
if exist "public\manifest.json" del /F /Q "public\manifest.json"

echo [PREP] Installing/restoring npm packages (WASM rollup)...
call npm install 2>&1
if %errorlevel% neq 0 ( echo FAILED: npm install & pause & exit /b 1 )
echo npm install SUCCESS.

echo [PREP] Cleaning old dist (force fresh build)...
rd /s /q "dist" 2>nul
echo Old dist removed.

echo [1/4] Building Vite with WASM Rollup...
set NODE_OPTIONS=--max-old-space-size=4096
call npm run build 2>&1
if %errorlevel% neq 0 (
    echo.
    echo FAILED: vite build - exit code %errorlevel%
    pause
    exit /b 1
)
echo Vite build SUCCESS.

echo [2/4] Copying icons to dist...
if exist "public\icon-512.png" xcopy /Y /Q "public\*.png" "dist\" 2>nul

echo [3/4] Syncing Capacitor (latest dist to Android)...
call npx cap sync android 2>&1
if %errorlevel% neq 0 ( echo FAILED: cap sync & pause & exit /b 1 )
echo Capacitor sync SUCCESS.

echo [4/4] Building Release AAB...
cd android
call .\gradlew.bat bundleRelease 2>&1
if %errorlevel% neq 0 (
    echo FAILED: gradlew bundleRelease
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ============================================
echo  AAB BUILD COMPLETE - v1.0.0
echo  android\app\build\outputs\bundle\release\app-release.aab
echo ============================================
explorer "android\app\build\outputs\bundle\release"
pause
