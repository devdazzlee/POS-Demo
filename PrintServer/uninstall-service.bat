@echo off
REM Uninstall Manpasand Print Server Windows Service

echo ============================================
echo Manpasand POS Print Server - Service Uninstaller
echo ============================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running as Administrator - Good!
) else (
    echo WARNING: Not running as Administrator
    echo Service uninstallation may require admin rights
    echo.
    pause
)

echo.
echo Uninstalling Windows Service...
echo.

node uninstall-service.js

echo.
echo ============================================
echo Uninstallation Complete!
echo ============================================
echo.
pause






