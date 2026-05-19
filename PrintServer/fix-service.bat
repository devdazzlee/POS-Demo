@echo off
REM Quick Fix - Start the service and set to automatic

echo ============================================
echo Quick Fix - Manpasand Print Server
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
    echo Please install the service first:
    echo   Right-click install-service.bat
    echo   Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [OK] Service exists
echo.

echo [STEP 2] Setting startup type to AUTOMATIC...
sc config "Manpasand Print Server" start= auto
if %errorLevel% == 0 (
    echo [OK] Startup type set to AUTOMATIC
) else (
    echo [WARNING] Could not set startup type (may need admin rights)
)

echo.
echo [STEP 3] Starting the service...
sc start "Manpasand Print Server"
if %errorLevel% == 0 (
    echo [OK] Service start command sent
) else (
    echo [WARNING] Could not start service (may already be running)
)

echo.
echo Waiting 3 seconds for service to start...
timeout /t 3 /nobreak >nul

echo.
echo [STEP 4] Checking service status...
sc query "Manpasand Print Server" | findstr /C:"STATE"
echo.

echo ============================================
echo Quick Fix Complete!
echo ============================================
echo.
echo If service is RUNNING:
echo   - Test: http://localhost:3001/health
echo   - Service will auto-start on boot
echo.
echo If service is STOPPED:
echo   - Check Event Viewer for errors
echo   - Try: troubleshoot-service.bat
echo.
pause






