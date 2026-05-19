@echo off
REM Silent script to configure print server for automatic startup
REM Run this ONCE as Administrator to ensure service starts automatically
REM After running this, the service will start automatically on every boot - NO customer interaction needed

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

echo ============================================
echo Configure Print Server for Auto-Start
echo ============================================
echo.
echo This will ensure the print server starts automatically
echo when your laptop boots - no customer interaction needed!
echo.

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
    echo [WARNING] Could not set startup type
    pause
    exit /b 1
)

echo.

REM Verify startup type
echo [STEP 3] Verifying startup type...
for /f "tokens=2 delims=:" %%a in ('sc qc "Manpasand Print Server" ^| findstr /C:"START_TYPE"') do set START_TYPE=%%a
echo Startup Type: %START_TYPE%
echo.

REM Check if service is running
echo [STEP 4] Checking service status...
for /f "tokens=3" %%a in ('sc query "Manpasand Print Server" ^| findstr /C:"STATE"') do set STATUS=%%a
echo Current Status: %STATUS%
echo.

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
    )
) else (
    echo [OK] Service is already running
)

echo.
echo ============================================
echo Configuration Complete!
echo ============================================
echo.
echo Summary:
echo   [OK] Service startup type: AUTOMATIC
echo   [OK] Service will start automatically on boot
echo   [OK] No customer interaction required
echo.
echo To verify:
echo   1. Restart your laptop
echo   2. The service will start automatically
echo   3. No login or user action needed!
echo.
echo Test after reboot: http://localhost:3001/health
echo.
pause








