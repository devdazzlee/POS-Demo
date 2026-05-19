@echo off
REM Install Manpasand Print Server as Windows Service
REM Run this as Administrator for best results

echo ============================================
echo Manpasand POS Print Server - Service Installer
echo ============================================
echo.
echo This will install the print server as a Windows service that:
echo - Starts automatically when Windows boots
echo - Auto-restarts if it crashes or closes
echo - Runs in the background without user interaction
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Running as Administrator
) else (
    echo [WARNING] Not running as Administrator
    echo Service installation requires admin rights
    echo Please right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo.
echo [STEP 1/3] Installing node-windows package...
echo.

REM Check if node-windows is installed
echo Checking for node-windows package...
npm list node-windows >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] node-windows not found, installing...
    echo Installing node-windows...
    call npm install node-windows --save
    if %errorLevel% neq 0 (
        echo [ERROR] Failed to install node-windows
        echo.
        echo Try installing manually:
        echo   npm install node-windows --save
        echo.
        pause
        exit /b 1
    )
    echo [OK] node-windows installed successfully
) else (
    echo [OK] node-windows already installed
)

echo.
echo [STEP 2/3] Installing Windows Service...
echo.

REM Install the service
node install-service.js
if %errorLevel% neq 0 (
    echo [ERROR] Failed to install service
    pause
    exit /b 1
)

echo.
echo [STEP 3/3] Starting service...
echo.

REM Try to start the service
node start-service.js

echo.
echo ============================================
echo Installation Complete!
echo ============================================
echo.
echo The print server is now installed as a Windows service.
echo.
echo Service will:
echo   [OK] Start automatically when Windows boots
echo   [OK] Auto-restart if it crashes or closes
echo   [OK] Run in the background (no user interaction needed)
echo.
echo To manage the service:
echo   - Start:   start-service.bat
echo   - Stop:    stop-service.bat
echo   - Status:  Open Services (services.msc) and find "Manpasand Print Server"
echo   - Uninstall: uninstall-service.bat
echo.
echo Server URL: http://localhost:3001
echo.
pause

