@echo off
REM Simple installer - keeps terminal open

echo ============================================
echo Simple Install - Manpasand Print Server
echo ============================================
echo.
echo This will install everything step by step.
echo Please keep the terminal open until it finishes.
echo.

REM Check admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARNING] Not running as Administrator
    echo Service installation may fail without admin rights
    echo.
    pause
)

cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo [STEP 1] Checking node-windows...
echo.

REM Check if node-windows is already installed
npm list node-windows >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] node-windows is already installed
    echo Skipping installation...
) else (
    echo [INFO] node-windows not found, installing...
    echo This may take 1-2 minutes. Please wait...
    echo.
    
    npm install node-windows --save
    
    REM Check if installation was successful (npm returns 0 even if already installed)
    npm list node-windows >nul 2>&1
    if %errorLevel% neq 0 (
        echo.
        echo [ERROR] npm install failed!
        echo.
        echo Please check:
        echo   1. Internet connection
        echo   2. npm is working (try: npm --version)
        echo   3. You're in the PrintServer folder
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo [OK] node-windows installed successfully
)
echo.
echo.
echo [STEP 2] Installing Windows Service...
echo.
echo Please wait, this may take a moment...
echo.

REM Check if service is already installed
sc query "Manpasand Print Server" >nul 2>&1
if %errorLevel% == 0 (
    echo [WARNING] Service already exists!
    echo.
    echo To reinstall, first run: uninstall-service.bat
    echo.
    echo Trying to install anyway (will show 'alreadyinstalled')...
    echo.
)

node install-service.js
set INSTALL_RESULT=%errorLevel%

REM Check if service exists now (success even if already installed)
sc query "Manpasand Print Server" >nul 2>&1
if %errorLevel% neq 0 (
    if %INSTALL_RESULT% neq 0 (
        echo.
        echo [ERROR] Service installation failed!
        echo.
        echo Please check:
        echo   1. You're running as Administrator
        echo   2. Node.js path is correct
        echo   3. Error messages above
        echo.
        pause
        exit /b 1
    )
)

echo.
echo [OK] Service installation completed
echo.
echo [STEP 3] Setting startup type to AUTOMATIC...
sc config "Manpasand Print Server" start= auto
echo [OK] Startup type set
echo.

echo [STEP 4] Starting service...
sc start "Manpasand Print Server"
echo [OK] Start command sent
echo.

echo Waiting 5 seconds...
timeout /t 5 /nobreak >nul

echo.
echo [STEP 5] Checking status...
echo.
sc query "Manpasand Print Server"
echo.

REM Check if running
for /f "tokens=3" %%a in ('sc query "Manpasand Print Server" ^| findstr /C:"STATE"') do set STATUS=%%a
echo Current Status: %STATUS%
echo.

if "%STATUS%"=="RUNNING" (
    echo [SUCCESS] Service is RUNNING!
    echo.
    echo The print server is ready!
    echo Test it: http://localhost:3001/health
) else (
    echo [INFO] Service status: %STATUS%
    echo.
    echo If status is not RUNNING:
    echo   - Wait a few seconds and try again
    echo   - Or run: start-service.bat
    echo   - Or check Event Viewer for errors
)

echo.
echo ============================================
echo Installation Complete!
echo ============================================
echo.
echo Test the server:
echo   http://localhost:3001/health
echo   http://localhost:3001/printers
echo.
echo Check service status:
echo   1. Open Services (Win+R, type: services.msc)
echo   2. Find "Manpasand Print Server"
echo   3. Status should be "Running"
echo.
echo To manage the service:
echo   - Start:   start-service.bat
echo   - Stop:    stop-service.bat
echo   - Status:  test-auto-start.bat
echo.
pause

