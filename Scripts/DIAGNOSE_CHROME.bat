@echo off
REM ============================================
REM Chrome Kiosk Mode Diagnostic Tool
REM ============================================

echo.
echo ============================================
echo   Chrome Kiosk Mode Diagnostic
echo ============================================
echo.

echo [1] Checking for running Chrome processes...
tasklist /FI "IMAGENAME eq chrome.exe" 2>NUL | find /I /N "chrome.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo    ⚠ Chrome is currently running
    echo    This may prevent flags from being applied
    echo.
    echo    Running Chrome processes:
    tasklist /FI "IMAGENAME eq chrome.exe"
) else (
    echo    ✓ No Chrome processes running
)
echo.

echo [2] Checking Chrome executable location...
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    echo    ✓ Chrome found: "C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    echo    ✓ Chrome found: "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else (
    echo    ✗ Chrome executable NOT found in standard locations!
    echo    Please check your Chrome installation.
)
echo.

echo [3] Checking Windows Startup folder...
echo    Checking: %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
dir /B "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\*.lnk" 2>NUL | find /I "chrome" >NUL
if "%ERRORLEVEL%"=="0" (
    echo    ⚠ Chrome shortcut found in Startup folder!
    echo    This may launch Chrome without kiosk flags at boot.
) else (
    echo    ✓ No Chrome shortcuts in Startup folder
)
echo.

echo [4] Checking for Chrome registry startup entries...
reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "GoogleChromeAutoLaunch*" >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo    ⚠ Chrome auto-launch found in registry!
    reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" | find /I "chrome"
) else (
    echo    ✓ No Chrome auto-launch in registry
)
echo.

echo [5] Recommended Actions:
echo    ============================================
echo    1. Close ALL Chrome windows manually
echo    2. Wait 10 seconds
echo    3. Run Start-POS.bat as Administrator
echo    4. Check chrome://version/ to verify flags
echo.
echo    If flags still don't appear:
echo    - Disable Chrome from Windows Startup
echo    - Check Task Scheduler for Chrome tasks
echo    - Make sure no shortcuts launch Chrome automatically
echo    ============================================
echo.

pause











