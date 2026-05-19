@echo off
REM Install required dependencies for Windows Service

echo ============================================
echo Installing Dependencies
echo ============================================
echo.

echo Installing node-windows package...
call npm install node-windows --save

if %errorLevel% == 0 (
    echo.
    echo [OK] Dependencies installed successfully!
    echo.
    echo You can now run:
    echo   node install-service.js
    echo   or
    echo   install-service.bat
) else (
    echo.
    echo [ERROR] Failed to install dependencies
    echo.
    pause
    exit /b 1
)

pause






