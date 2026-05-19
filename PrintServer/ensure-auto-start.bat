@echo off
REM Silent script to ensure print server service starts automatically on boot
REM No user interaction - runs silently in background
REM This script can be added to Windows Startup or Task Scheduler

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Check if service exists
sc query "Manpasand Print Server" >nul 2>&1
if %errorLevel% neq 0 (
    REM Service doesn't exist - exit silently
    exit /b 0
)

REM Set startup type to AUTOMATIC (silent)
sc config "Manpasand Print Server" start= auto >nul 2>&1

REM Check current status
for /f "tokens=3" %%a in ('sc query "Manpasand Print Server" ^| findstr /C:"STATE"') do set STATUS=%%a

REM If service is stopped, start it (silent)
if "%STATUS%"=="STOPPED" (
    sc start "Manpasand Print Server" >nul 2>&1
)

REM Exit silently - no output
exit /b 0








