# One-Click Setup Script for New Laptop
# This script does everything automatically
# Run as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Print Server - Setup for New Laptop" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir
Write-Host "Working directory: $scriptDir" -ForegroundColor Gray
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "  1. Right-click this file" -ForegroundColor Gray
    Write-Host "  2. Select 'Run with PowerShell'" -ForegroundColor Gray
    Write-Host "  3. If prompted, select 'Run as Administrator'" -ForegroundColor Gray
    Write-Host ""
    pause
    exit 1
}

Write-Host "[OK] Running as Administrator" -ForegroundColor Green
Write-Host ""

# Check Node.js
Write-Host "[STEP 1] Checking Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js first:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://nodejs.org/" -ForegroundColor Gray
    Write-Host "  2. Install it" -ForegroundColor Gray
    Write-Host "  3. Run this script again" -ForegroundColor Gray
    Write-Host ""
    pause
    exit 1
}

Write-Host ""

# Check if node_modules exists
Write-Host "[STEP 2] Checking dependencies..." -ForegroundColor Cyan
$nodeModulesPath = Join-Path $scriptDir "node_modules"
$packageJsonPath = Join-Path $scriptDir "package.json"

if (-not (Test-Path $nodeModulesPath) -and (Test-Path $packageJsonPath)) {
    Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes..." -ForegroundColor Gray
    Write-Host ""
    
    Push-Location $scriptDir
    & npm install
    Pop-Location
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        Write-Host "Please run: npm install" -ForegroundColor Yellow
        pause
        exit 1
    }
    
    Write-Host "[OK] Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[OK] Dependencies already installed" -ForegroundColor Green
}

Write-Host ""

# Check if service already exists
Write-Host "[STEP 3] Checking for existing service..." -ForegroundColor Cyan
$serviceName = "manpasandprintserver.exe"
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($existingService) {
    Write-Host "[INFO] Service already exists" -ForegroundColor Yellow
    Write-Host "  Name: $($existingService.Name)" -ForegroundColor Gray
    Write-Host "  Status: $($existingService.Status)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  1. Continue - will configure existing service" -ForegroundColor Gray
    Write-Host "  2. Cancel - to uninstall and reinstall manually" -ForegroundColor Gray
    Write-Host ""
    $continue = Read-Host "Continue? (Y/N)"
    if ($continue -ne "Y" -and $continue -ne "y") {
        Write-Host "Cancelled" -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "[INFO] Service does not exist, will install new" -ForegroundColor Gray
}

Write-Host ""

# Install service if needed
if (-not $existingService) {
    Write-Host "[STEP 4] Installing Windows Service..." -ForegroundColor Cyan
    
    $installPath = Join-Path $scriptDir "install-service.js"
    if (-not (Test-Path $installPath)) {
        Write-Host "[ERROR] install-service.js not found!" -ForegroundColor Red
        pause
        exit 1
    }
    
    Write-Host "[INFO] Running install-service.js..." -ForegroundColor Gray
    Push-Location $scriptDir
    & node "$installPath" 2>&1 | Out-Host
    $installExitCode = $LASTEXITCODE
    Pop-Location
    
    if ($installExitCode -ne 0) {
        Write-Host "[ERROR] Service installation failed!" -ForegroundColor Red
        Write-Host "Check the output above for errors" -ForegroundColor Yellow
        pause
        exit 1
    }
    
    # Wait for service to be registered
    Write-Host "[INFO] Waiting for service to be registered..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    # Verify service exists
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if (-not $service) {
        Write-Host "[ERROR] Service not found after installation!" -ForegroundColor Red
        Write-Host "Check Event Viewer for errors" -ForegroundColor Yellow
        pause
        exit 1
    }
    
    Write-Host "[OK] Service installed successfully" -ForegroundColor Green
    Write-Host ""
}

# Configure automatic startup
Write-Host "[STEP 5] Configuring automatic startup..." -ForegroundColor Cyan
try {
    Set-Service -Name $serviceName -StartupType Automatic -ErrorAction Stop
    Write-Host "[OK] Startup type set to Automatic" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Set-Service failed, trying sc config..." -ForegroundColor Yellow
    $null = sc.exe config "$serviceName" start= auto 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Startup type set using sc config" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to set startup type!" -ForegroundColor Red
    }
}

# Verify startup type
$verified = (Get-WmiObject Win32_Service -Filter "Name='$serviceName'").StartMode
if ($verified -eq "Auto") {
    Write-Host "[OK] Verified: Startup type is Automatic" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Startup type verification: $verified" -ForegroundColor Yellow
}

Write-Host ""

# Configure recovery options
Write-Host "[STEP 6] Configuring recovery options..." -ForegroundColor Cyan
try {
    $recoveryCmd = "sc failure `"$serviceName`" reset= 86400 actions= restart/60000/restart/60000/restart/60000"
    $null = cmd /c $recoveryCmd 2>&1
    Write-Host "[OK] Recovery options configured (auto-restart on failure)" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Could not configure recovery (non-critical)" -ForegroundColor Yellow
}

Write-Host ""

# Start the service
Write-Host "[STEP 7] Starting service..." -ForegroundColor Cyan
$service = Get-Service -Name $serviceName
if ($service.Status -eq "Running") {
    Write-Host "[OK] Service is already running" -ForegroundColor Green
} else {
    try {
        Start-Service -Name $serviceName -ErrorAction Stop
        Write-Host "[OK] Service start command sent" -ForegroundColor Green
        
        Start-Sleep -Seconds 5
        
        $finalStatus = (Get-Service -Name $serviceName).Status
        if ($finalStatus -eq "Running") {
            Write-Host "[SUCCESS] Service is now RUNNING!" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Service status: $finalStatus" -ForegroundColor Yellow
            Write-Host "Service may still be starting..." -ForegroundColor Gray
        }
    } catch {
        Write-Host "[ERROR] Failed to start service: $_" -ForegroundColor Red
        Write-Host "Check Event Viewer for errors" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test server
Write-Host "[STEP 8] Testing server..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "[SUCCESS] Server is responding!" -ForegroundColor Green
        Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor Gray
        Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "[WARNING] Server not responding yet: $_" -ForegroundColor Yellow
    Write-Host "Service may need more time to start" -ForegroundColor Gray
    Write-Host "Test manually: http://localhost:3001/health" -ForegroundColor Gray
}

Write-Host ""

# Final summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$finalService = Get-Service -Name $serviceName
$finalStartMode = (Get-WmiObject Win32_Service -Filter "Name='$serviceName'").StartMode

Write-Host "Final Status:" -ForegroundColor Cyan
Write-Host "  Service Name: $($finalService.Name)" -ForegroundColor Gray
Write-Host "  Display Name: $($finalService.DisplayName)" -ForegroundColor Gray
Write-Host "  Status: $($finalService.Status)" -ForegroundColor $(if ($finalService.Status -eq "Running") { "Green" } else { "Yellow" })
Write-Host "  Startup Type: $finalStartMode" -ForegroundColor $(if ($finalStartMode -eq "Auto") { "Green" } else { "Yellow" })
Write-Host ""

if ($finalStartMode -eq "Auto" -and $finalService.Status -eq "Running") {
    Write-Host "[SUCCESS] Everything is configured correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The service will:" -ForegroundColor Cyan
    Write-Host "  - Start automatically when laptop boots" -ForegroundColor Green
    Write-Host "  - Work without user login" -ForegroundColor Green
    Write-Host "  - Auto-restart if it crashes" -ForegroundColor Green
    Write-Host "  - Require no customer interaction" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Some configuration may need adjustment" -ForegroundColor Yellow
    Write-Host "Run ensure-service-auto-start.ps1 to verify/fix" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To verify auto-start:" -ForegroundColor Cyan
Write-Host "  1. Restart laptop (don't log in)" -ForegroundColor Gray
Write-Host "  2. Wait for Windows to boot" -ForegroundColor Gray
Write-Host "  3. Test: http://localhost:3001/health" -ForegroundColor Gray
Write-Host ""
pause







