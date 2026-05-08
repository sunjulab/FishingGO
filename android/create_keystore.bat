@echo off
cd /d "%~dp0"

echo Generating keystore...
keytool -genkey -v ^
  -keystore fishinggo-release.jks ^
  -keyalg RSA ^
  -keysize 2048 ^
  -validity 10000 ^
  -alias fishinggo ^
  -storepass "@sunjulab910414" ^
  -keypass "@sunjulab910414" ^
  -dname "CN=FishingGO, OU=FishingGO, O=FishingGO, L=Seoul, ST=Seoul, C=KR"

if %errorlevel% neq 0 (
    echo FAILED - check if Java is installed: java -version
    pause
    exit /b 1
)

echo.
echo Done! fishinggo-release.jks created.
dir fishinggo-release.jks
pause
