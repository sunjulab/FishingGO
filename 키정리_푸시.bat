@echo off
chcp 65001 >nul
cd /d "%~dp0"
set KEY=project-44537168-c5ce-406a-8dc-cc837a0c3301.json
echo [1/6] Move key file out of the project folder
if not exist "%USERPROFILE%\Documents\FishingGO_keys" mkdir "%USERPROFILE%\Documents\FishingGO_keys"
if exist "%KEY%" move "%KEY%" "%USERPROFILE%\Documents\FishingGO_keys\%KEY%"
echo [2/6] Fetch GitHub
git fetch origin
if errorlevel 1 goto fail
echo [3/6] Safety check: local must contain origin/main
git merge-base --is-ancestor origin/main HEAD
if errorlevel 1 (
  echo STOP: GitHub has newer commits. Nothing was changed. Tell Claude.
  goto end
)
echo [4/6] Re-pack unpushed commits without the key
git reset --soft origin/main
git rm --cached --ignore-unmatch -q -- "%KEY%"
git add .gitignore
git diff --cached --name-only | findstr /i "project-44537168" >nul
if not errorlevel 1 (
  echo STOP: key file is still staged. Nothing was pushed. Tell Claude.
  goto end
)
echo [5/6] Commit
git commit -m "chore: release v1.0.253 (remove service account key file)"
if errorlevel 1 goto fail
echo [6/6] Push
git push origin main
if errorlevel 1 goto fail
echo.
echo DONE. Key file is now in Documents\FishingGO_keys
goto end
:fail
echo FAILED. Copy the messages above and send them to Claude.
:end
pause
