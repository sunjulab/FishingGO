@echo off
cd /d "%~dp0"

echo Removing conflicting files...
if exist "public\manifest.json" del /F /Q "public\manifest.json"
if exist "public\_manifest_note.js" del /F /Q "public\_manifest_note.js"

REM Check if dist/index.html already exists — skip rebuild if so
if exist "dist\index.html" (
    echo [1/3] dist\index.html found - skipping Vite build
    goto SYNC
)

echo [1/3] Building Vite...
set NODE_OPTIONS=--max-old-space-size=4096
call npx vite build --config vite.android.config.js 2>&1
if %errorlevel% neq 0 (
    echo.
    echo FAILED: vite build - exit code %errorlevel%
    echo If this keeps failing, manually place built files in dist\ folder
    pause
    exit /b 1
)

:SYNC
echo [2/3] Copying icons to dist...
if exist "public\icon-512.png" xcopy /Y /Q "public\*.png" "dist\" 2>nul

echo [3/3] Syncing Capacitor...
call npx cap sync android 2>&1
if %errorlevel% neq 0 ( echo FAILED: cap sync & pause & exit /b 1 )

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
echo  AAB BUILD COMPLETE
echo  android\app\build\outputs\bundle\release\app-release.aab
echo ============================================
explorer "android\app\build\outputs\bundle\release"
pause
