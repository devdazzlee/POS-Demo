@echo off
REM Troubleshoot Manpasand Print Server Service

echo ============================================
echo Troubleshooting Manpasand Print Server
echo ============================================
echo.

echo [CHECK 1] Checking if service exists...
sc query "Manpasand Print Server" >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Service exists
) else (
    echo [ERROR] Service does NOT exist!
    echo.
    echo Solution: Install the service first
    echo   Right-click install-service.bat
    echo   Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo.
echo [CHECK 2] Checking service status...
echo.
sc query "Manpasand Print Server" | findstr /C:"STATE" > temp_status.txt
findstr /C:"RUNNING" temp_status.txt >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Service is RUNNING
    echo.
    echo The service is working correctly!
    echo Try: http://localhost:3001/health
) else (
    echo [WARNING] Service is NOT running
    echo.
    echo [FIX] Attempting to start the service...
    echo.
    
    REM Try to start the service
    sc start "Manpasand Print Server"
    
    REM Wait a moment
    timeout /t 2 /nobreak >nul
    
    REM Check again
    sc query "Manpasand Print Server" | findstr /C:"STATE" > temp_status2.txt
    findstr /C:"RUNNING" temp_status2.txt >nul 2>&1
    if %errorLevel% == 0 (
        echo [SUCCESS] Service started successfully!
        echo.
        echo The service is now running.
        echo Try: http://localhost:3001/health
    ) else (
        echo [ERROR] Failed to start service
        echo.
        echo Checking for errors...
        echo.
        sc query "Manpasand Print Server"
        echo.
        echo Common issues:
        echo   1. Port 3001 might be in use
        echo   2. Node.js not in PATH
        echo   3. Missing dependencies
        echo   4. Service configuration error
        echo.
        echo To check logs:
        echo   1. Open Event Viewer (eventvwr.msc)
        echo   2. Windows Logs ^> Application
        echo   3. Look for "Manpasand Print Server" errors
    )
    del temp_status2.txt 2>nul
)

echo.
echo [CHECK 3] Checking startup type...
sc qc "Manpasand Print Server" | findstr /C:"START_TYPE" > temp_startup.txt
findstr /C:"AUTO_START" temp_startup.txt >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Startup type is AUTOMATIC
    echo       Service will start automatically on boot
) else (
    echo [WARNING] Startup type is NOT automatic
    echo.
    echo [FIX] Setting startup type to AUTOMATIC...
    sc config "Manpasand Print Server" start= auto
    if %errorLevel% == 0 (
        echo [SUCCESS] Startup type set to AUTOMATIC
    ) else (
        echo [ERROR] Failed to set startup type (may need admin rights)
    )
)

echo.
echo ============================================
echo Full Service Information:
echo ============================================
sc query "Manpasand Print Server"
echo.
sc qc "Manpasand Print Server"
echo.

REM Cleanup
del temp_status.txt temp_startup.txt 2>nul

echo ============================================
echo Troubleshooting Complete!
echo ============================================
echo.
echo Next steps:
echo   1. If service is running, test: http://localhost:3001/health
echo   2. If service won't start, check Event Viewer for errors
echo   3. If port 3001 is in use, stop the process using it
echo.
pause






