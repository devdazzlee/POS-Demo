# Simple Printer Settings Check
$printerName = "ZDesigner GC420t (EPL)"

Write-Host "========================================"
Write-Host "Printer Settings Check"
Write-Host "========================================"
Write-Host ""

# Check printer info
Write-Host "Printer Information:"
$printer = Get-Printer -Name $printerName -ErrorAction SilentlyContinue
if ($printer) {
    $printer | Format-List Name, PortName, DriverName, PrinterStatus
} else {
    Write-Host "Printer not found. Trying alternative name..."
    $printer = Get-Printer -Name "ZDesigner GC420t" -ErrorAction SilentlyContinue
    if ($printer) {
        $printer | Format-List Name, PortName, DriverName, PrinterStatus
    } else {
        Write-Host "Printer not found"
        exit 1
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "IMPORTANT: Check These Settings"
Write-Host "========================================"
Write-Host ""
Write-Host "1. Open Printer Properties:"
Write-Host "   - Right-click printer -> Properties"
Write-Host ""
Write-Host "2. Go to 'Printing Preferences' -> 'Options' tab:"
Write-Host "   - Orientation: MUST be 'Landscape'"
Write-Host "   - Size: MUST be 58.00 x 40.00 mm"
Write-Host "   - Click 'Apply' then 'OK'"
Write-Host ""
Write-Host "3. Go to 'Properties' -> 'Advanced' tab:"
Write-Host "   - Click 'Printing Defaults' button"
Write-Host "   - Check orientation is 'Landscape'"
Write-Host "   - Click 'Apply' then 'OK'"
Write-Host ""
Write-Host "4. If using ZPL (raw printing), the driver should NOT process it."
Write-Host "   But some drivers still apply rotation even to raw ZPL."
Write-Host ""
Write-Host "5. Try this:"
Write-Host "   - Uninstall the printer driver"
Write-Host "   - Reinstall with 'Generic / Text Only' driver"
Write-Host "   - Or use 'RAW' port type"
Write-Host ""



