@echo off
REM ============================================
REM MANPASAND POS - Silent Launch (No Window)
REM ============================================

REM Kill ALL Chrome-related processes silently
taskkill /F /IM chrome.exe /T >nul 2>&1
taskkill /F /IM GoogleCrashHandler.exe /T >nul 2>&1
taskkill /F /IM GoogleCrashHandler64.exe /T >nul 2>&1

REM Wait longer for processes to fully close
timeout /t 5 /nobreak >nul

REM Double-check Chrome is closed
tasklist /FI "IMAGENAME eq chrome.exe" 2>NUL | find /I /N "chrome.exe">NUL
if "%ERRORLEVEL%"=="0" (
    taskkill /F /IM chrome.exe /T >nul 2>&1
    timeout /t 3 /nobreak >nul
)

REM Launch Chrome with kiosk flags using direct execution
REM Add ?kiosk-printing=true to URL so frontend can detect it
cd /d "C:\Program Files\Google\Chrome\Application"
start "" chrome.exe --profile-directory="Default" --kiosk-printing --kiosk "https://pos.manpasandstore.com?kiosk-printing=true"

exit

