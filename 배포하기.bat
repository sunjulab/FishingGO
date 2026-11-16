@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [FishingGO] npm run deploy start
call npm run deploy
echo.
echo [FishingGO] deploy finished. Check messages above, then press any key.
pause
