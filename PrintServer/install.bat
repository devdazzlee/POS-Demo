@echo off
echo Installing Manpasand POS Print Server...
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo Minimum version: 18.x
    pause
    exit /b 1
)

echo Node.js found!
echo.

REM Install dependencies
echo Installing dependencies...
cd /d "%~dp0"
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✅ Installation complete!
echo.
echo Next steps:
echo 1. Update printer name in server.js
echo 2. Run: npm start
echo 3. Or double-click: start-print-server.bat
echo.
pause






