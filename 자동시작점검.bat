@echo off
chcp 65001 > nul
echo.
echo ========================================
echo  낚시GO 자동 서버 시작 + 오류 점검
echo ========================================
echo.

echo [1] 기존 서버 프로세스 종료 중...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak > nul

echo [2] 백엔드 서버 시작 (포트 5000)...
start "낚시GO 백엔드" cmd /k "cd /d %~dp0server && npm run dev 2>&1"

timeout /t 4 /nobreak > nul

echo [3] 프론트엔드 서버 시작 (포트 5173)...
start "낚시GO 프론트" cmd /k "cd /d %~dp0 && npm run dev 2>&1"

echo.
echo ✅ 서버 시작 명령이 전송되었습니다!
echo.
echo 8초 후 브라우저가 열립니다...
timeout /t 8 /nobreak > nul

start "" http://localhost:5173
start "" http://localhost:5000/api/health

echo.
echo 서버 상태 확인:
echo - 프론트엔드: http://localhost:5173
echo - 백엔드 헬스: http://localhost:5000/api/health
echo.
echo 터미널 창에서 오류 메시지를 확인하세요.
pause
