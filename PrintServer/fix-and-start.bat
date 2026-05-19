@echo off
REM Fix service installation and start it properly

echo ============================================
echo Fix and Start Manpasand Print Server
echo ============================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script MUST be run as Administrator!
    echo.
    echo Please:
    echo   1. Right-click this file
    echo   2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo [STEP 1] Checking if service exists...
sc query "Manpasand Print Server" >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Service exists
    goto :start_service
)

echo [INFO] Service does NOT exist (or not properly installed)
echo.
echo [STEP 2] Uninstalling any phantom service...
node uninstall-service.js >nul 2>&1
echo [OK] Cleanup done
echo.

echo [STEP 3] Installing service properly (as Administrator)...
echo.
node install-service.js

echo.
echo [STEP 4] Waiting 3 seconds for service to register...
timeout /t 3 /nobreak >nul

echo.
echo [STEP 5] Verifying service exists...
sc query "Manpasand Print Server" >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Service installation failed!
    echo.
    echo The service was not created. This could be due to:
    echo   1. Node.js path issues
    echo   2. Missing dependencies
    echo   3. Permission issues
    echo.
    echo Check Event Viewer for errors:
    echo   Win+R ^> eventvwr.msc ^> Windows Logs ^> Application
    echo.
    pause
    exit /b 1
)

echo [OK] Service exists now
echo.

:start_service
echo [STEP 6] Setting startup type to AUTOMATIC...
sc config "Manpasand Print Server" start= auto
if %errorLevel% == 0 (
    echo [OK] Startup type set to AUTOMATIC
) else (
    echo [WARNING] Could not set startup type (error %errorLevel%)
)
echo.

echo [STEP 7] Starting service...
sc start "Manpasand Print Server"
if %errorLevel% == 0 (
    echo [OK] Start command sent
) else (
    echo [ERROR] Failed to start service (error %errorLevel%)
    echo.
    echo Check Event Viewer for errors:
    echo   Win+R ^> eventvwr.msc ^> Windows Logs ^> Application
    echo.
    pause
    exit /b 1
)
echo.

echo Waiting 5 seconds for service to start...
timeout /t 5 /nobreak >nul
echo.

echo [STEP 8] Checking service status...
sc query "Manpasand Print Server"
echo.

for /f "tokens=3" %%a in ('sc query "Manpasand Print Server" ^| findstr /C:"STATE"') do set STATUS=%%a
echo Current Status: %STATUS%
echo.

if "%STATUS%"=="RUNNING" (
    echo [SUCCESS] Service is RUNNING!
    echo.
    echo Test the server:
    echo   http://localhost:3001/health
    echo   http://localhost:3001/printers
    echo.
) else (
    echo [WARNING] Service status: %STATUS%
    echo.
    echo Service may still be starting, or there may be an error.
    echo.
    echo Check Event Viewer for errors:
    echo   1. Press Win+R
    echo   2. Type: eventvwr.msc
    echo   3. Go to: Windows Logs ^> Application
    echo   4. Look for "Manpasand Print Server" errors
    echo.
)

echo ============================================
echo Complete!
echo ============================================
echo.
pause






