@echo off
REM This script opens Command Prompt as Administrator in the PrintServer folder

echo ============================================
echo Opening Command Prompt as Administrator
echo ============================================
echo.
echo This will open a new Command Prompt window as Administrator
echo in the PrintServer folder.
echo.
echo Then run these commands one by one:
echo.
echo   1. node install-service.js
echo   2. sc query "Manpasand Print Server"
echo   3. sc config "Manpasand Print Server" start= auto
echo   4. sc start "Manpasand Print Server"
echo   5. sc query "Manpasand Print Server"
echo.
echo ============================================
echo.

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0

REM Open Command Prompt as Administrator
powershell -Command "Start-Process cmd -Verb RunAs -ArgumentList '/k cd /d \"%SCRIPT_DIR%\" && echo ============================================ && echo Manpasand Print Server - Installation && echo ============================================ && echo. && echo Current directory: %SCRIPT_DIR% && echo. && echo Run these commands one by one: && echo. && echo   1. node install-service.js && echo   2. sc query \"Manpasand Print Server\" && echo   3. sc config \"Manpasand Print Server\" start= auto && echo   4. sc start \"Manpasand Print Server\" && echo   5. sc query \"Manpasand Print Server\" && echo. && echo Test: curl http://localhost:3001/health && echo. && pause'"

