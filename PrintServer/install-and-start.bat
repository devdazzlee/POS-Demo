@echo off
REM All-in-one: Install and Start the service

echo ============================================
echo Install and Start Manpasand Print Server
echo ============================================
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

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo Current directory: %CD%
echo.

echo [STEP 1] Checking if service exists...
sc query "Manpasand Print Server" >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Service already exists
    goto :start_service
)

echo [INFO] Service does not exist, installing now...
echo.

echo [STEP 1.1] Installing node-windows package...
echo.

REM Check if node-windows is installed
echo Checking for node-windows...
npm list node-windows >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] node-windows not found, installing...
    echo This may take a minute...
    echo.
    
    REM Run npm install and show output
    echo Installing node-windows (this may take a minute)...
    call npm install node-windows --save
    set INSTALL_ERROR=%errorLevel%
    
    REM Show npm output
    if %INSTALL_ERROR% neq 0 (
        echo.
        echo npm install returned error code: %INSTALL_ERROR%
    )
    
    echo.
    if %INSTALL_ERROR% neq 0 (
        echo [ERROR] Failed to install node-windows
        echo.
        echo This might be due to:
        echo   1. Network connection issues
        echo   2. npm not configured properly
        echo   3. Permission issues
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

echo.
echo [STEP 1.2] Installing Windows Service...
echo.

REM Check if install-service.js exists
if not exist "install-service.js" (
    echo [ERROR] install-service.js not found!
    echo Current directory: %CD%
    echo Make sure you're in the PrintServer directory
    echo.
    pause
    exit /b 1
)

if not exist "server.js" (
    echo [ERROR] server.js not found!
    echo Current directory: %CD%
    echo Make sure you're in the PrintServer directory
    echo.
    pause
    exit /b 1
)

echo Running install-service.js...
echo Please wait, this may take a moment...
echo.

node install-service.js
set INSTALL_SVC_ERROR=%errorLevel%

if %INSTALL_SVC_ERROR% neq 0 (
    echo.
    echo [ERROR] Failed to install service
    echo.
    echo Common issues:
    echo   1. Service already installed (run uninstall-service.bat first)
    echo   2. Not running as Administrator
    echo   3. Node.js path issues
    echo.
    echo Check the error message above for details
    echo.
    pause
    exit /b 1
)

echo.
echo Waiting 3 seconds for service to be registered...
timeout /t 3 /nobreak >nul

REM Check if service exists now
sc query "Manpasand Print Server" >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Service installation may have failed
    echo Please check the output above for errors
    pause
    exit /b 1
)

echo [OK] Service installed successfully
echo.

:start_service
echo [STEP 2] Checking service status...
for /f "tokens=3" %%a in ('sc query "Manpasand Print Server" ^| findstr /C:"STATE"') do set STATUS=%%a
echo Current status: %STATUS%

if "%STATUS%"=="RUNNING" (
    echo [OK] Service is already running!
    goto :test_service
)

echo.
echo [STEP 3] Setting startup type to AUTOMATIC...
sc config "Manpasand Print Server" start= auto
if %errorLevel% == 0 (
    echo [OK] Startup type set to AUTOMATIC
) else (
    echo [WARNING] Could not set startup type (may need admin)
)

echo.
echo [STEP 4] Starting the service...
sc start "Manpasand Print Server"
if %errorLevel% == 0 (
    echo [OK] Service start command sent
) else (
    echo [ERROR] Failed to start service
    echo.
    echo Please check Event Viewer for errors:
    echo   1. Press Win + R
    echo   2. Type: eventvwr.msc
    echo   3. Go to: Windows Logs ^> Application
    echo   4. Look for "Manpasand Print Server" errors
    pause
    exit /b 1
)

echo.
echo Waiting 5 seconds for service to start...
timeout /t 5 /nobreak >nul

echo.
echo [STEP 5] Checking service status...
for /f "tokens=3" %%a in ('sc query "Manpasand Print Server" ^| findstr /C:"STATE"') do set STATUS=%%a
echo Current status: %STATUS%

if "%STATUS%"=="RUNNING" (
    echo [SUCCESS] Service is now RUNNING!
) else (
    echo [WARNING] Service status is not RUNNING
    echo Check Event Viewer for errors
)

:test_service
echo.
echo [STEP 6] Testing server connection...
echo.
timeout /t 2 /nobreak >nul

curl -s http://localhost:3001/health >nul 2>&1
if %errorLevel% == 0 (
    echo [SUCCESS] Server is responding!
    echo.
    echo Service is working correctly!
    echo.
    echo Test URLs:
    echo   Health: http://localhost:3001/health
    echo   Printers: http://localhost:3001/printers
) else (
    echo [WARNING] Server is not responding yet
    echo Service may still be starting up...
    echo Try again in a few seconds
    echo.
    echo Or check: http://localhost:3001/health
)

echo.
echo ============================================
echo Installation Complete!
echo ============================================
echo.
echo Summary:
sc query "Manpasand Print Server" >nul 2>&1
if %errorLevel% == 0 (
    echo   [OK] Service is installed
    for /f "tokens=3" %%a in ('sc query "Manpasand Print Server" ^| findstr /C:"STATE"') do set FINAL_STATUS=%%a
    if "%FINAL_STATUS%"=="RUNNING" (
        echo   [OK] Service is RUNNING
        echo   [OK] Set to start automatically on boot
        echo.
        echo The print server is now ready!
        echo Test it: http://localhost:3001/health
    ) else (
        echo   [INFO] Service status: %FINAL_STATUS%
        echo   [INFO] Service may be starting up...
        echo   [OK] Set to start automatically on boot
        echo.
        echo Please wait a few seconds and test: http://localhost:3001/health
    )
) else (
    echo   [ERROR] Service installation may have failed
    echo   Please check the output above
)

echo.
echo To manage the service:
echo   - Check status: Open Services (services.msc)
echo   - Start: start-service.bat
echo   - Stop: stop-service.bat
echo   - Uninstall: uninstall-service.bat
echo.
pause

