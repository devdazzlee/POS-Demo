@echo off
REM One-click setup to enable automatic startup - no customer interaction needed
REM Run this ONCE as Administrator to configure automatic startup

echo ============================================
echo Enable Automatic Startup - Print Server
echo ============================================
echo.
echo This will configure the print server to start
echo automatically when your laptop boots.
echo.
echo NO customer interaction needed after setup!
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script must be run as Administrator!
    echo.
    echo Please:
    echo   1. Right-click this file
    echo   2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [OK] Running as Administrator
echo.

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Check if service exists
echo [STEP 1] Checking if service exists...
sc query "Manpasand Print Server" >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Service does NOT exist!
    echo.
    echo Please install the service first:
    echo   1. Right-click install-and-start.bat
    echo   2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [OK] Service exists
echo.

REM Set startup type to AUTOMATIC
echo [STEP 2] Setting startup type to AUTOMATIC...
sc config "Manpasand Print Server" start= auto
if %errorLevel% == 0 (
    echo [OK] Startup type set to AUTOMATIC
) else (
    echo [ERROR] Failed to set startup type
    pause
    exit /b 1
)

echo.

REM Verify startup type
echo [STEP 3] Verifying startup type...
for /f "tokens=2 delims=:" %%a in ('sc qc "Manpasand Print Server" ^| findstr /C:"START_TYPE"') do set START_TYPE=%%a
echo Startup Type: %START_TYPE%
if "%START_TYPE%"=="2" (
    echo [SUCCESS] Startup type is AUTOMATIC!
) else (
    echo [WARNING] Startup type verification failed
)
echo.

REM Check if service is running
echo [STEP 4] Checking service status...
for /f "tokens=3" %%a in ('sc query "Manpasand Print Server" ^| findstr /C:"STATE"') do set STATUS=%%a
echo Current Status: %STATUS%
echo.

REM Start service if not running
if "%STATUS%"=="STOPPED" (
    echo [STEP 5] Starting service...
    sc start "Manpasand Print Server"
    if %errorLevel% == 0 (
        echo [OK] Service start command sent
        echo.
        echo Waiting 3 seconds...
        timeout /t 3 /nobreak >nul
        echo.
        echo [STEP 6] Verifying service started...
        for /f "tokens=3" %%a in ('sc query "Manpasand Print Server" ^| findstr /C:"STATE"') do set STATUS=%%a
        if "%STATUS%"=="RUNNING" (
            echo [SUCCESS] Service is now RUNNING!
        ) else (
            echo [INFO] Service status: %STATUS%
            echo Service may still be starting...
        )
    ) else (
        echo [WARNING] Could not start service
        echo Service should start automatically on next boot
    )
) else (
    echo [OK] Service is already running
)

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Summary:
echo   [OK] Service startup type: AUTOMATIC
echo   [OK] Service will start automatically on boot
echo   [OK] No customer interaction required
echo   [OK] Works without user login
echo.
echo What happens next:
echo   1. When you boot your laptop, the service starts automatically
echo   2. No login or user action needed
echo   3. Service runs in background silently
echo   4. Print server is ready: http://localhost:3001/health
echo.
echo To verify:
echo   1. Restart your laptop (don't log in)
echo   2. Wait for Windows to boot
echo   3. Open browser on another device
echo   4. Go to: http://YOUR-LAPTOP-IP:3001/health
echo   5. If you see {"status":"ok"}, it's working! ✅
echo.
echo Optional: Setup Task Scheduler (extra safety net)
echo   Run: setup-task-scheduler.ps1 as Administrator
echo   This ensures service is running even if it fails to start automatically
echo.
pause








