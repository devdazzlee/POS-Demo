@echo off
REM ============================================
REM MANPASAND POS - Chrome Kiosk Launch
REM ============================================

echo.
echo ============================================
echo   MANPASAND POS - Starting...
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

REM Launch Chrome with kiosk printing flags using direct execution
echo.
echo [4/4] Launching POS in Kiosk Mode...
echo    URL: https://pos.manpasandstore.com
echo    Flags: --profile-directory="Default" --kiosk-printing --kiosk
echo.

REM Use direct execution instead of "start" command
REM Add ?kiosk-printing=true to URL so frontend can detect it
cd /d "C:\Program Files\Google\Chrome\Application"
start "" chrome.exe --profile-directory="Default" --kiosk-printing --kiosk "https://pos.manpasandstore.com?kiosk-printing=true"

REM Wait for Chrome to fully start
timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo   ✓ POS launched in Kiosk Mode!
echo ============================================
echo.
echo   IMPORTANT: Verify flags are applied:
echo   1. Press F11 to exit fullscreen (if needed)
echo   2. Go to chrome://version/
echo   3. Check "Command Line" section
echo   4. Should see: --profile-directory="Default" --kiosk-printing --kiosk
echo.
echo   Printing will be SILENT (no dialog)
echo   Chrome is now in FULLSCREEN mode
echo.
echo   Press any key to close this window...
pause >nul

