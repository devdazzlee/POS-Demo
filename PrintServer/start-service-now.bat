@echo off
REM Quick script to check status and start the service

echo ============================================
echo Start Manpasand Print Server Service
echo ============================================
echo.

echo [STEP 1] Checking service status...
sc query "Manpasand Print Server"
echo.

for /f "tokens=3" %%a in ('sc query "Manpasand Print Server" ^| findstr /C:"STATE"') do set STATUS=%%a
echo Current Status: %STATUS%
echo.

if "%STATUS%"=="RUNNING" (
    echo [OK] Service is already RUNNING!
    echo.
    echo Test it: http://localhost:3001/health
    goto :end
)

if "%STATUS%"=="STOPPED" (
    echo [INFO] Service is STOPPED
    echo.
    echo [STEP 2] Setting startup type to AUTOMATIC...
    sc config "Manpasand Print Server" start= auto
    echo [OK] Startup type set to AUTOMATIC
    echo.
    echo [STEP 3] Starting service...
    sc start "Manpasand Print Server"
    echo [OK] Start command sent
    echo.
    echo Waiting 5 seconds...
    timeout /t 5 /nobreak >nul
    echo.
    echo [STEP 4] Checking status again...
    for /f "tokens=3" %%a in ('sc query "Manpasand Print Server" ^| findstr /C:"STATE"') do set STATUS=%%a
    echo Current Status: %STATUS%
    echo.
    
    if "%STATUS%"=="RUNNING" (
        echo [SUCCESS] Service is now RUNNING!
        echo.
        echo Test it: http://localhost:3001/health
    ) else (
        echo [WARNING] Service failed to start
        echo Status: %STATUS%
        echo.
        echo Check Event Viewer for errors:
        echo   1. Press Win+R
        echo   2. Type: eventvwr.msc
        echo   3. Go to: Windows Logs ^> Application
        echo   4. Look for "Manpasand Print Server" errors
    )
) else (
    echo [WARNING] Service status: %STATUS%
    echo.
    echo Try starting manually:
    echo   sc start "Manpasand Print Server"
)

:end
echo.
echo ============================================
echo Complete!
echo ============================================
echo.
echo NOTE: If service doesn't exist, you need to install it as Administrator.
echo Right-click fix-and-start.bat and select "Run as administrator"
echo.
pause

