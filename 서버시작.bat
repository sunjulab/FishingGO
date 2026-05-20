@echo off
chcp 65001 > nul
echo.
echo ========================================
echo  낚시GO 개발 서버 시작
echo ========================================
echo.

echo [1] 백엔드 서버 시작 (포트 5000)...
start "낚시GO 백엔드" cmd /k "cd /d c:\Users\palin\Desktop\낚시GO\server && npm run dev"

timeout /t 3 /nobreak > nul

echo [2] 프론트엔드 서버 시작 (포트 5173)...
start "낚시GO 프론트" cmd /k "cd /d c:\Users\palin\Desktop\낚시GO && npm run dev"

echo.
echo 두 서버가 시작되었습니다!
echo 브라우저에서 http://localhost:5173 을 열어주세요.
echo.
timeout /t 8 /nobreak > nul

start "" http://localhost:5173
