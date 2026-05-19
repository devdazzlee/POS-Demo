@echo off
REM ============================================
REM MANPASAND POS - Silent Printing Only
REM (No Fullscreen - Normal Window Mode)
REM ============================================

echo.
echo ============================================
echo   MANPASAND POS - Starting...
echo   Mode: Silent Printing (No Fullscreen)
echo ============================================
echo.

REM Kill ALL Chrome-related processes (including background)
echo [1/4] Closing ALL Chrome processes...
taskkill /F /IM chrome.exe /T >nul 2>&1
taskkill /F /IM GoogleCrashHandler.exe /T >nul 2>&1
taskkill /F /IM GoogleCrashHandler64.exe /T >nul 2>&1
echo    ✓ Chrome processes terminated

REM Wait longer for processes to fully close and release resources
echo.
echo [2/4] Waiting for processes to fully close...
timeout /t 5 /nobreak >nul

REM Verify Chrome is closed
echo.
echo [3/4] Verifying Chrome is closed...
tasklist /FI "IMAGENAME eq chrome.exe" 2>NUL | find /I /N "chrome.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo    ⚠ Chrome still running, force closing...
    taskkill /F /IM chrome.exe /T >nul 2>&1
    timeout /t 3 /nobreak >nul
) else (
    echo    ✓ Chrome fully closed
)

REM Launch Chrome with kiosk printing flag ONLY (no fullscreen)
echo.
echo [4/4] Launching POS...
echo    URL: https://pos.manpasandstore.com
echo    Flag: --kiosk-printing (silent printing, normal window)
echo.

REM Use direct execution - NO --kiosk flag (normal window)
REM Add ?kiosk-printing=true to URL so frontend can detect it
cd /d "C:\Program Files\Google\Chrome\Application"
start "" chrome.exe --profile-directory="Default" --kiosk-printing "https://pos.manpasandstore.com?kiosk-printing=true"

REM Wait for Chrome to fully start
timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo   ✓ POS launched!
echo ============================================
echo.
echo   Features:
echo   - Silent printing (no print dialog)
echo   - Normal window (not fullscreen)
echo   - You can minimize, resize, etc.
echo.
echo   IMPORTANT: Verify flags are applied:
echo   1. Go to chrome://version/
echo   2. Check "Command Line" section
echo   3. Should see: --profile-directory="Default" --kiosk-printing
echo   (Should NOT see --kiosk flag)
echo.
echo   Press any key to close this window...
pause >nul


