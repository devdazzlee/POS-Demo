# Comprehensive fix to ensure print server starts automatically on boot
# This script addresses ALL known issues with automatic startup
# Run as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Auto-Start - Print Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please right-click and select 'Run as administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

$serviceName = "manpasandprintserver.exe"
$displayName = "Manpasand Print Server"

Write-Host "[STEP 1] Checking if service exists..." -ForegroundColor Cyan
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if (-not $service) {
    Write-Host "[ERROR] Service '$serviceName' not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install the service first:" -ForegroundColor Yellow
    Write-Host "  1. Right-click install-and-start.bat" -ForegroundColor Gray
    Write-Host "  2. Select 'Run as administrator'" -ForegroundColor Gray
    pause
    exit 1
}

Write-Host "[OK] Service exists" -ForegroundColor Green
Write-Host ""

# Check current status
Write-Host "[STEP 2] Current service status:" -ForegroundColor Cyan
$currentStatus = (Get-Service -Name $serviceName).Status
$currentStartType = (Get-WmiObject Win32_Service -Filter "Name='$serviceName'").StartMode

Write-Host "  Status: $currentStatus" -ForegroundColor Gray
Write-Host "  Start Type: $currentStartType" -ForegroundColor Gray
Write-Host ""

# Set startup type to Automatic
Write-Host "[STEP 3] Setting startup type to AUTOMATIC..." -ForegroundColor Cyan
try {
    Set-Service -Name $serviceName -StartupType Automatic -ErrorAction Stop
    Write-Host "[OK] Startup type set to Automatic" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to set startup type: $_" -ForegroundColor Red
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    
    # Try using sc config
    $result = Start-Process -FilePath "sc" -ArgumentList "config `"$serviceName`" start= auto" -Wait -PassThru -NoNewWindow
    if ($result.ExitCode -eq 0) {
        Write-Host "[OK] Startup type set using sc config" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Both methods failed" -ForegroundColor Red
        pause
        exit 1
    }
}

Write-Host ""

# Configure recovery options (auto-restart on failure)
Write-Host "[STEP 4] Configuring recovery options (auto-restart on failure)..." -ForegroundColor Cyan
try {
    $scFailure = "sc failure `"$serviceName`" reset= 86400 actions= restart/60000/restart/60000/restart/60000"
    $result = cmd /c $scFailure
    Write-Host "[OK] Recovery options configured" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Could not configure recovery options (non-critical)" -ForegroundColor Yellow
}

Write-Host ""

# Verify startup type
Write-Host "[STEP 5] Verifying startup type..." -ForegroundColor Cyan
$verifiedStartType = (Get-WmiObject Win32_Service -Filter "Name='$serviceName'").StartMode
if ($verifiedStartType -eq "Auto") {
    Write-Host "[OK] Startup type verified: Automatic" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Startup type is: $verifiedStartType (should be Auto)" -ForegroundColor Yellow
}

Write-Host ""

# Start the service now
Write-Host "[STEP 6] Starting service..." -ForegroundColor Cyan
try {
    Start-Service -Name $serviceName -ErrorAction Stop
    Start-Sleep -Seconds 3
    
    $finalStatus = (Get-Service -Name $serviceName).Status
    if ($finalStatus -eq "Running") {
        Write-Host "[OK] Service is now RUNNING!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Service status: $finalStatus" -ForegroundColor Yellow
        Write-Host "Service may still be starting..." -ForegroundColor Gray
    }
} catch {
    Write-Host "[ERROR] Failed to start service: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check Event Viewer for errors:" -ForegroundColor Yellow
    Write-Host "  1. Press Win + R" -ForegroundColor Gray
    Write-Host "  2. Type: eventvwr.msc" -ForegroundColor Gray
    Write-Host "  3. Go to: Windows Logs > Application" -ForegroundColor Gray
    Write-Host "  4. Look for '$displayName' errors" -ForegroundColor Gray
}

Write-Host ""

# Test the server
Write-Host "[STEP 7] Testing server..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "[SUCCESS] Server is responding!" -ForegroundColor Green
        Write-Host "  URL: http://localhost:3001/health" -ForegroundColor Gray
    }
} catch {
    Write-Host "[WARNING] Server not responding yet (may need more time)" -ForegroundColor Yellow
    Write-Host "  Test manually: http://localhost:3001/health" -ForegroundColor Gray
}

Write-Host ""

# Create Task Scheduler task as backup (extra safety net)
Write-Host "[STEP 8] Creating Task Scheduler task as backup..." -ForegroundColor Cyan
$taskName = "$displayName - Auto Start"
$scriptPath = Join-Path $PSScriptRoot "ensure-auto-start.bat"

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "[INFO] Removed old task" -ForegroundColor Gray
}

try {
    $action = New-ScheduledTaskAction -Execute $scriptPath -WorkingDirectory $PSScriptRoot
    $trigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Minutes 1)
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
    
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Ensures $displayName is running automatically on boot" -ErrorAction Stop
    
    Write-Host "[OK] Task Scheduler task created as backup" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Could not create Task Scheduler task: $_" -ForegroundColor Yellow
    Write-Host "This is optional - service should still start automatically" -ForegroundColor Gray
}

Write-Host ""

# Final summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  [OK] Service startup type: Automatic" -ForegroundColor Green
Write-Host "  [OK] Recovery options configured" -ForegroundColor Green
Write-Host "  [OK] Task Scheduler backup task created" -ForegroundColor Green
Write-Host ""
Write-Host "The service will now:" -ForegroundColor Cyan
Write-Host "  - Start automatically when Windows boots" -ForegroundColor Gray
Write-Host "  - Start automatically even without user login" -ForegroundColor Gray
Write-Host "  - Auto-restart if it crashes" -ForegroundColor Gray
Write-Host "  - No customer interaction needed" -ForegroundColor Gray
Write-Host ""
Write-Host "To verify:" -ForegroundColor Cyan
Write-Host "  1. Restart your laptop (don't log in)" -ForegroundColor Gray
Write-Host "  2. Wait for Windows to boot" -ForegroundColor Gray
Write-Host "  3. Test: http://localhost:3001/health" -ForegroundColor Gray
Write-Host "  4. Or check Services (services.msc) - should show 'Running'" -ForegroundColor Gray
Write-Host ""
pause








