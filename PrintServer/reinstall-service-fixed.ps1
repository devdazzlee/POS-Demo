# Complete reinstall with proper automatic startup configuration
# Run as Administrator - This will fix everything

# CRITICAL: Change to script directory first
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir
Write-Host "Working directory: $scriptDir" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Reinstall Print Server Service (Fixed)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    pause
    exit 1
}

$serviceName = "manpasandprintserver.exe"
$scriptPath = Join-Path $scriptDir "server.js"

Write-Host "[STEP 1] Uninstalling existing service..." -ForegroundColor Cyan
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($existingService) {
    try {
        if ($existingService.Status -eq "Running") {
            Write-Host "[INFO] Stopping service..." -ForegroundColor Gray
            Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
        
        Write-Host "[INFO] Running uninstall-service.js..." -ForegroundColor Gray
        $uninstallPath = Join-Path $scriptDir "uninstall-service.js"
        if (Test-Path $uninstallPath) {
            & node "$uninstallPath" 2>&1 | Out-Host
            Write-Host "[OK] Old service uninstalled" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] uninstall-service.js not found, using sc delete..." -ForegroundColor Yellow
            $result = sc.exe delete "$serviceName" 2>&1
            Write-Host $result
        }
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "[WARNING] Uninstall had issues: $_" -ForegroundColor Yellow
        # Try direct sc delete as fallback
        Write-Host "[INFO] Trying direct service deletion..." -ForegroundColor Gray
        sc.exe delete "$serviceName" 2>&1 | Out-Host
    }
} else {
    Write-Host "[INFO] No existing service to uninstall" -ForegroundColor Gray
}

Write-Host ""

# Check if node-windows is installed
Write-Host "[STEP 2] Checking node-windows..." -ForegroundColor Cyan
$nodeWindowsPath = Join-Path $scriptDir "node_modules\node-windows"
if (-not (Test-Path $nodeWindowsPath)) {
    Write-Host "[INFO] Installing node-windows..." -ForegroundColor Yellow
    Push-Location $scriptDir
    & npm install node-windows --save --silent
    Pop-Location
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install node-windows" -ForegroundColor Red
        pause
        exit 1
    }
}
Write-Host "[OK] node-windows ready" -ForegroundColor Green
Write-Host ""

# Check if server.js exists
Write-Host "[STEP 3] Checking server.js..." -ForegroundColor Cyan
if (-not (Test-Path $scriptPath)) {
    Write-Host "[ERROR] server.js not found at: $scriptPath" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
    pause
    exit 1
}
Write-Host "[OK] server.js found" -ForegroundColor Green
Write-Host ""

# Install the service
Write-Host "[STEP 4] Installing service..." -ForegroundColor Cyan
try {
    $installPath = Join-Path $scriptDir "install-service.js"
    if (-not (Test-Path $installPath)) {
        throw "install-service.js not found at: $installPath"
    }
    
    Write-Host "[INFO] Running install-service.js from: $scriptDir" -ForegroundColor Gray
    Push-Location $scriptDir
    & node "$installPath" 2>&1 | Out-Host
    $installExitCode = $LASTEXITCODE
    Pop-Location
    
    if ($installExitCode -ne 0) {
        throw "Installation script returned error code: $installExitCode"
    }
    
    # Wait for service to be registered
    Write-Host "[INFO] Waiting for service to be registered..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    # Verify service exists
    $newService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if (-not $newService) {
        throw "Service not found after installation. Check Event Viewer for errors."
    }
    
    Write-Host "[OK] Service installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Installation failed: $_" -ForegroundColor Red
    Write-Host "Check Event Viewer for detailed errors:" -ForegroundColor Yellow
    Write-Host "  Win + R > eventvwr.msc > Windows Logs > Application" -ForegroundColor Gray
    pause
    exit 1
}

Write-Host ""

# CRITICAL: Set startup type to Automatic
Write-Host "[STEP 5] Setting startup type to AUTOMATIC..." -ForegroundColor Cyan
try {
    Set-Service -Name $serviceName -StartupType Automatic -ErrorAction Stop
    Write-Host "[OK] Startup type set to Automatic" -ForegroundColor Green
    
    # Verify
    $verified = (Get-WmiObject Win32_Service -Filter "Name='$serviceName'").StartMode
    if ($verified -eq "Auto") {
        Write-Host "[OK] Verified: Startup type is Automatic" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Verification shows: $verified" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Failed to set startup type: $_" -ForegroundColor Red
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    
    $result = Start-Process -FilePath "sc" -ArgumentList "config `"$serviceName`" start= auto" -Wait -PassThru -NoNewWindow
    if ($result.ExitCode -eq 0) {
        Write-Host "[OK] Set using sc config" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Both methods failed" -ForegroundColor Red
        pause
        exit 1
    }
}

Write-Host ""

# Configure recovery (auto-restart on failure)
Write-Host "[STEP 6] Configuring recovery options..." -ForegroundColor Cyan
try {
    $scFailure = "sc failure `"$serviceName`" reset= 86400 actions= restart/60000/restart/60000/restart/60000"
    cmd /c $scFailure | Out-Null
    Write-Host "[OK] Recovery configured (auto-restart on failure)" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Could not configure recovery (non-critical)" -ForegroundColor Yellow
}

Write-Host ""

# Start the service
Write-Host "[STEP 7] Starting service..." -ForegroundColor Cyan
try {
    Start-Service -Name $serviceName -ErrorAction Stop
    Start-Sleep -Seconds 5
    
    $finalStatus = (Get-Service -Name $serviceName).Status
    if ($finalStatus -eq "Running") {
        Write-Host "[SUCCESS] Service is RUNNING!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Service status: $finalStatus" -ForegroundColor Yellow
        Write-Host "Checking Event Viewer for errors..." -ForegroundColor Gray
    }
} catch {
    Write-Host "[ERROR] Failed to start: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check Event Viewer for errors:" -ForegroundColor Yellow
    Write-Host "  Win + R > eventvwr.msc > Windows Logs > Application" -ForegroundColor Gray
}

Write-Host ""

# Test server
Write-Host "[STEP 8] Testing server..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "[SUCCESS] Server is responding!" -ForegroundColor Green
        Write-Host "  URL: http://localhost:3001/health" -ForegroundColor Gray
    }
} catch {
    Write-Host "[WARNING] Server not responding yet" -ForegroundColor Yellow
    Write-Host "  May need more time to start" -ForegroundColor Gray
    Write-Host "  Test manually: http://localhost:3001/health" -ForegroundColor Gray
}

Write-Host ""

# Final summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Configuration:" -ForegroundColor Cyan
Write-Host "  [OK] Startup Type: Automatic" -ForegroundColor Green
Write-Host "  [OK] Recovery: Auto-restart on failure" -ForegroundColor Green
Write-Host "  [OK] Will start automatically on boot" -ForegroundColor Green
Write-Host "  [OK] No customer interaction needed" -ForegroundColor Green
Write-Host ""
Write-Host "To verify:" -ForegroundColor Cyan
Write-Host "  1. Restart laptop (don't log in)" -ForegroundColor Gray
Write-Host "  2. Test: http://localhost:3001/health" -ForegroundColor Gray
Write-Host "  3. Check Services (services.msc) - should show 'Running'" -ForegroundColor Gray
Write-Host ""
pause

