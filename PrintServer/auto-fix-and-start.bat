@echo off
REM Auto-fix and start the service - Run as Administrator

echo ============================================
echo Auto-Fix and Start Manpasand Print Server
echo ============================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Running as Administrator
) else (
    echo [WARNING] Not running as Administrator
    echo Some operations may require admin rights
    echo.
)

echo.
echo [STEP 1] Checking if service exists...
sc query "Manpasand Print Server" >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Service does NOT exist!
    echo.
    echo Installing service now...
    echo.
    
    REM Get the directory where this batch file is located
    set SCRIPT_DIR=%~dp0
    
    REM Check if install-service.bat exists
    if exist "%SCRIPT_DIR%install-service.bat" (
        echo [OK] Found install-service.bat
        echo Running installer...
        echo.
        cd /d "%SCRIPT_DIR%"
        call "%SCRIPT_DIR%install-service.bat"
        if %errorLevel% neq 0 (
            echo [ERROR] Failed to install service
            echo.
            echo Please run install-service.bat manually:
            echo   1. Right-click install-service.bat
            echo   2. Select "Run as administrator"
            pause
            exit /b 1
        )
    ) else (
        echo [ERROR] install-service.bat not found!
        echo.
        echo Current directory: %CD%
        echo Script directory: %SCRIPT_DIR%
        echo.
        echo Please make sure you're running this from the PrintServer folder
        echo Or manually run: install-service.bat
        pause
        exit /b 1
    )
    
    REM Wait a moment for installation to complete
    timeout /t 3 /nobreak >nul
    
    REM Check again if service exists
    sc query "Manpasand Print Server" >nul 2>&1
    if %errorLevel% neq 0 (
        echo [ERROR] Service installation may have failed
        echo Please check the install-service.bat output above
        pause
        exit /b 1
    ) else (
        echo [OK] Service installed successfully
    )
) else (
    echo [OK] Service exists
)

echo.
echo [STEP 2] Checking current status...
for /f "tokens=3" %%a in ('sc query "Manpasand Print Server" ^| findstr /C:"STATE"') do set STATUS=%%a
echo Current status: %STATUS%

if "%STATUS%"=="RUNNING" (
    echo [OK] Service is already running!
    echo.
    echo Testing connection...
    curl -s http://localhost:3001/health >nul 2>&1
    if %errorLevel% == 0 (
        echo [OK] Server is responding!
        echo.
        echo Service is working correctly!
        echo URL: http://localhost:3001/health
    ) else (
        echo [WARNING] Service is running but not responding
        echo This might indicate a startup error
    )
    goto :end
)

echo [INFO] Service is not running, attempting to start...
echo.

echo [STEP 3] Setting startup type to AUTOMATIC...
sc config "Manpasand Print Server" start= auto >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Startup type set to AUTOMATIC
) else (
    echo [WARNING] Could not set startup type
)

echo.
echo [STEP 4] Checking if port 3001 is in use...
netstat -ano | findstr ":3001" >nul 2>&1
if %errorLevel% == 0 (
    echo [WARNING] Port 3001 is already in use!
    echo.
    echo Finding process using port 3001...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
        set PORT_PID=%%a
        echo Process ID: %%a
        echo Attempting to kill process %%a...
        taskkill /PID %%a /F >nul 2>&1
        if %errorLevel% == 0 (
            echo [OK] Process killed
        ) else (
            echo [WARNING] Could not kill process (may need admin rights)
        )
    )
    timeout /t 2 /nobreak >nul
)

echo.
echo [STEP 5] Starting the service...
sc start "Manpasand Print Server"
if %errorLevel% == 0 (
    echo [OK] Service start command sent
) else (
    echo [ERROR] Failed to start service
    echo.
    echo Checking for errors...
    goto :check_errors
)

echo.
echo Waiting 5 seconds for service to start...
timeout /t 5 /nobreak >nul

echo.
echo [STEP 6] Checking service status...
for /f "tokens=3" %%a in ('sc query "Manpasand Print Server" ^| findstr /C:"STATE"') do set STATUS=%%a
echo Current status: %STATUS%

if "%STATUS%"=="RUNNING" (
    echo [SUCCESS] Service is now RUNNING!
    echo.
    echo Testing connection...
    timeout /t 2 /nobreak >nul
    curl -s http://localhost:3001/health >nul 2>&1
    if %errorLevel% == 0 (
        echo [OK] Server is responding!
        echo.
        echo Service is working correctly!
        echo URL: http://localhost:3001/health
        echo Printers: http://localhost:3001/printers
    ) else (
        echo [WARNING] Service is running but not responding
        echo Check Event Viewer for errors
    )
) else (
    echo [ERROR] Service failed to start
    goto :check_errors
)

goto :end

:check_errors
echo.
echo [TROUBLESHOOTING] Checking for common issues...
echo.

echo Checking Event Viewer for errors...
echo Please check Event Viewer (eventvwr.msc) for detailed errors
echo Path: Windows Logs ^> Application ^> Look for "Manpasand Print Server"
echo.

echo Checking Node.js installation...
where node >nul 2>&1
if %errorLevel% == 0 (
    for /f "delims=" %%i in ('where node') do (
        echo [OK] Node.js found at: %%i
        node --version
    )
) else (
    echo [ERROR] Node.js not found in PATH!
    echo Service cannot run without Node.js
    echo Please install Node.js and add it to PATH
)

echo.
echo Checking if server.js exists...
if exist "server.js" (
    echo [OK] server.js found
) else (
    echo [ERROR] server.js not found!
    echo Make sure you're running this from the PrintServer directory
)

echo.
echo Checking dependencies...
if exist "node_modules" (
    echo [OK] node_modules folder exists
) else (
    echo [WARNING] node_modules folder not found
    echo Run: npm install
)

echo.
echo Service information:
sc qc "Manpasand Print Server"
echo.
sc query "Manpasand Print Server"
echo.

:end
echo.
echo ============================================
echo Auto-Fix Complete!
echo ============================================
echo.
echo Next steps:
echo   1. If service is RUNNING: Test http://localhost:3001/health
echo   2. If service won't start: Check Event Viewer for errors
echo   3. Restart your laptop to test auto-start
echo.
pause

