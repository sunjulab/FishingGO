@echo off
chcp 65001 > nul
title 낚시GO 서버 시작

echo.
echo  ====================================
echo   낚시GO 백엔드 + 프론트 동시 시작
echo  ====================================
echo.
echo  잠시만 기다려주세요...
echo.

start "낚시GO-백엔드 (PORT 5000)" cmd /k "cd /d c:\Users\palin\Desktop\낚시GO\server && npm run dev"

timeout /t 4 /nobreak > nul

start "낚시GO-프론트 (PORT 5173)" cmd /k "cd /d c:\Users\palin\Desktop\낚시GO && npm run dev"

echo  두 서버가 시작됩니다.
echo  12초 후 브라우저가 열립니다...
timeout /t 12 /nobreak > nul

start "" http://localhost:5173
