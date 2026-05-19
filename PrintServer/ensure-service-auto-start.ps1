# Final fix to ensure service starts automatically on boot
# This ensures the service is properly configured for automatic startup
# Run as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ensure Service Auto-Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click and select 'Run as administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

$serviceName = "manpasandprintserver.exe"

Write-Host "[STEP 1] Checking service..." -ForegroundColor Cyan
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "[ERROR] Service '$serviceName' not found!" -ForegroundColor Red
    Write-Host "Please install the service first." -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "[OK] Service found" -ForegroundColor Green
Write-Host "  Name: $($service.Name)" -ForegroundColor Gray
Write-Host "  DisplayName: $($service.DisplayName)" -ForegroundColor Gray
Write-Host "  Current Status: $($service.Status)" -ForegroundColor Gray
Write-Host "  Current StartType: $($service.StartType)" -ForegroundColor Gray
Write-Host ""

# Set startup type to Automatic
Write-Host "[STEP 2] Setting startup type to AUTOMATIC..." -ForegroundColor Cyan
try {
    Set-Service -Name $serviceName -StartupType Automatic -ErrorAction Stop
    Write-Host "[OK] Startup type set to Automatic using Set-Service" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Set-Service failed: $_" -ForegroundColor Yellow
    Write-Host "[INFO] Trying sc config..." -ForegroundColor Gray
    
    $result = sc.exe config "$serviceName" start= auto
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Startup type set using sc config" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Both methods failed!" -ForegroundColor Red
        pause
        exit 1
    }
}

# Verify startup type
Write-Host "[STEP 3] Verifying startup type..." -ForegroundColor Cyan
$verified = (Get-WmiObject Win32_Service -Filter "Name='$serviceName'").StartMode
Write-Host "  Verified StartMode: $verified" -ForegroundColor Gray

if ($verified -eq "Auto") {
    Write-Host "[SUCCESS] Startup type confirmed: Automatic!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Startup type is: $verified (should be Auto)" -ForegroundColor Yellow
}

Write-Host ""

# Configure recovery options (CRITICAL for auto-start)
Write-Host "[STEP 4] Configuring recovery options..." -ForegroundColor Cyan
Write-Host "  This ensures service auto-restarts if it crashes" -ForegroundColor Gray
try {
    # Reset failure count after 24 hours (86400 seconds)
    # Actions: restart after 60 seconds, restart again after 60 seconds, restart again after 60 seconds
    $recoveryCmd = "sc failure `"$serviceName`" reset= 86400 actions= restart/60000/restart/60000/restart/60000"
    $null = cmd /c $recoveryCmd 2>&1
    
    # Verify recovery settings
    $recoveryCheck = sc.exe qfailure "$serviceName"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Recovery options configured" -ForegroundColor Green
        Write-Host "  Service will auto-restart on failure" -ForegroundColor Gray
    } else {
        Write-Host "[WARNING] Could not verify recovery options" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Could not configure recovery options: $_" -ForegroundColor Yellow
    Write-Host "  This is non-critical but recommended" -ForegroundColor Gray
}

Write-Host ""

# Start the service now
Write-Host "[STEP 5] Starting service..." -ForegroundColor Cyan
if ($service.Status -eq "Running") {
    Write-Host "[OK] Service is already running" -ForegroundColor Green
} else {
    try {
        Start-Service -Name $serviceName -ErrorAction Stop
        Write-Host "[OK] Service start command sent" -ForegroundColor Green
        
        # Wait and verify
        Start-Sleep -Seconds 5
        $finalStatus = (Get-Service -Name $serviceName).Status
        
        if ($finalStatus -eq "Running") {
            Write-Host "[SUCCESS] Service is now RUNNING!" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Service status: $finalStatus" -ForegroundColor Yellow
            Write-Host "  Service may still be starting..." -ForegroundColor Gray
        }
    } catch {
        Write-Host "[ERROR] Failed to start service: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Check Event Viewer for errors:" -ForegroundColor Yellow
        Write-Host "  Win + R > eventvwr.msc > Windows Logs > Application" -ForegroundColor Gray
    }
}

Write-Host ""

# Test server
Write-Host "[STEP 6] Testing server..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "[SUCCESS] Server is responding!" -ForegroundColor Green
        Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor Gray
        Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "[WARNING] Server not responding: $_" -ForegroundColor Yellow
    Write-Host "  Service may need more time to start" -ForegroundColor Gray
    Write-Host "  Test manually: http://localhost:3001/health" -ForegroundColor Gray
}

Write-Host ""

# Final summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$finalService = Get-Service -Name $serviceName
$finalStartMode = (Get-WmiObject Win32_Service -Filter "Name='$serviceName'").StartMode

Write-Host "Final Configuration:" -ForegroundColor Cyan
Write-Host "  Service Name: $($finalService.Name)" -ForegroundColor Gray
Write-Host "  Display Name: $($finalService.DisplayName)" -ForegroundColor Gray
Write-Host "  Status: $($finalService.Status)" -ForegroundColor $(if ($finalService.Status -eq "Running") { "Green" } else { "Yellow" })
Write-Host "  Startup Type: $finalStartMode" -ForegroundColor $(if ($finalStartMode -eq "Auto") { "Green" } else { "Yellow" })
Write-Host ""

if ($finalStartMode -eq "Auto" -and $finalService.Status -eq "Running") {
    Write-Host "[SUCCESS] Everything is configured correctly!" -ForegroundColor Green
    Write-Host "  Service will start automatically on boot" -ForegroundColor Green
    Write-Host "  Service is currently running" -ForegroundColor Green
    Write-Host "  No customer interaction needed" -ForegroundColor Green
} elseif ($finalStartMode -eq "Auto") {
    Write-Host "[WARNING] Service is set to Auto but not running" -ForegroundColor Yellow
    Write-Host "  Check Event Viewer for errors" -ForegroundColor Yellow
} else {
    Write-Host "[ERROR] Service startup type is not Automatic!" -ForegroundColor Red
    Write-Host "  Run this script again as Administrator" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To verify auto-start:" -ForegroundColor Cyan
Write-Host "  1. Restart laptop (don't log in)" -ForegroundColor Gray
Write-Host "  2. Wait for Windows to boot" -ForegroundColor Gray
Write-Host "  3. Test: http://localhost:3001/health" -ForegroundColor Gray
Write-Host "  4. Or check Services (services.msc) - should show 'Running'" -ForegroundColor Gray
Write-Host ""
pause








