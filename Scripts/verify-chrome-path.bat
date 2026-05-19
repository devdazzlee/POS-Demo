@echo off
echo Checking Chrome installation paths...
echo.

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    echo ✓ Found Chrome at: C:\Program Files\Google\Chrome\Application\chrome.exe
    echo   Use this path in your shortcut!
) else (
    echo ✗ Not found: C:\Program Files\Google\Chrome\Application\chrome.exe
)

if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    echo ✓ Found Chrome at: C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
    echo   Use this path if above not found!
) else (
    echo ✗ Not found: C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
)

echo.
echo Your command should be:
echo "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk https://pos.manpasandstore.com
echo.
pause












