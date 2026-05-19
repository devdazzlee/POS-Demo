# PowerShell script to create Task Scheduler task for automatic service verification
# This ensures the print server service is running even if it fails to start automatically
# Run this ONCE as Administrator

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:"
    Write-Host "  1. Right-click PowerShell"
    Write-Host "  2. Select 'Run as administrator'"
    Write-Host "  3. Navigate to PrintServer folder"
    Write-Host "  4. Run: .\setup-task-scheduler.ps1"
    Write-Host ""
    pause
    exit 1
}

$scriptPath = Join-Path $PSScriptRoot "ensure-auto-start.bat"
$taskName = "Manpasand Print Server - Auto Start"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Setup Task Scheduler for Auto-Start" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "[INFO] Task already exists. Removing old task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

Write-Host "[STEP 1] Creating Task Scheduler task..." -ForegroundColor Cyan
Write-Host "Task Name: $taskName" -ForegroundColor Gray
Write-Host "Script Path: $scriptPath" -ForegroundColor Gray
Write-Host ""

# Create the action (run the batch file)
$action = New-ScheduledTaskAction -Execute $scriptPath -WorkingDirectory $PSScriptRoot

# Create the trigger (at system startup, with delay)
$trigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Minutes 1)

# Create the principal (run as SYSTEM with highest privileges)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Create settings (allow start on demand, restart on failure)
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# Register the task
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Description "Ensures Manpasand Print Server service is running automatically on boot - no user interaction required" `
        -ErrorAction Stop
    
    Write-Host "[SUCCESS] Task Scheduler task created!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Task Details:" -ForegroundColor Cyan
    Write-Host "  Name: $taskName" -ForegroundColor Gray
    Write-Host "  Trigger: At System Startup" -ForegroundColor Gray
    Write-Host "  User: SYSTEM (runs automatically)" -ForegroundColor Gray
    Write-Host "  Action: Ensures service is set to automatic and running" -ForegroundColor Gray
    Write-Host ""
    Write-Host "This task will run automatically when Windows boots." -ForegroundColor Green
    Write-Host "No customer interaction required!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed to create task: $_" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  [OK] Task Scheduler task created" -ForegroundColor Green
Write-Host "  [OK] Will run automatically on boot" -ForegroundColor Green
Write-Host "  [OK] Runs as SYSTEM (no login needed)" -ForegroundColor Green
Write-Host "  [OK] Ensures service is set to automatic and running" -ForegroundColor Green
Write-Host ""
Write-Host "To verify:" -ForegroundColor Cyan
Write-Host "  1. Open Task Scheduler (taskschd.msc)" -ForegroundColor Gray
Write-Host "  2. Look for: '$taskName'" -ForegroundColor Gray
Write-Host "  3. Task should be 'Ready' and enabled" -ForegroundColor Gray
Write-Host ""
Write-Host "To test:" -ForegroundColor Cyan
Write-Host "  1. Restart your laptop" -ForegroundColor Gray
Write-Host "  2. Service should start automatically" -ForegroundColor Gray
Write-Host "  3. Test: http://localhost:3001/health" -ForegroundColor Gray
Write-Host ""
pause








