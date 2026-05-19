@echo off
REM Test if the service is set to start automatically

echo ============================================
echo Testing Auto-Start Configuration
echo ============================================
echo.

echo [CHECK 1] Checking if service exists...
sc query "Manpasand Print Server" >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Service exists
) else (
    echo [ERROR] Service does NOT exist!
    echo Install the service first: install-service.bat
    pause
    exit /b 1
)

echo.
echo [CHECK 2] Checking startup type...
echo.

REM Query service configuration
sc qc "Manpasand Print Server" | findstr /C:"START_TYPE" > temp_service_info.txt

REM Check if AUTO_START is in the file
findstr /C:"AUTO_START" temp_service_info.txt >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Startup type is set to AUTOMATIC
    echo       Service will start automatically on boot!
) else (
    echo [WARNING] Startup type is NOT automatic!
    echo          Service will NOT start automatically.
    echo.
    echo To fix:
    echo   1. Open Services (services.msc)
    echo   2. Find "Manpasand Print Server"
    echo   3. Right-click ^> Properties
    echo   4. Set "Startup type" to "Automatic"
    echo   5. Click OK
)

echo.
echo [CHECK 3] Checking current status...
sc query "Manpasand Print Server" | findstr /C:"STATE" > temp_status.txt
findstr /C:"RUNNING" temp_status.txt >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Service is currently RUNNING
) else (
    echo [INFO] Service is currently STOPPED
    echo       To start: start-service.bat
)

echo.
echo ============================================
echo Full Service Information:
echo ============================================
sc qc "Manpasand Print Server"
echo.
sc query "Manpasand Print Server"
echo.

REM Cleanup
del temp_service_info.txt temp_status.txt 2>nul

echo ============================================
echo Test Complete!
echo ============================================
echo.
echo Summary:
echo   - Service exists: Check above
echo   - Auto-start: Check above
echo   - Current status: Check above
echo.
echo To verify auto-start works:
echo   1. Restart your laptop
echo   2. Wait for Windows to boot
echo   3. Open browser
echo   4. Go to: http://localhost:3001/health
echo   5. If you see {"status":"ok"}, it's working!
echo.
pause






