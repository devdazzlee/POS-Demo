# Test Printer Orientation Settings
# This script checks printer settings and sends a test ZPL with explicit orientation

$printerName = "ZDesigner GC420t (EPL)"

Write-Host "========================================"
Write-Host "Printer Orientation Diagnostic"
Write-Host "========================================"
Write-Host ""

# 1. Check printer info
Write-Host "1. Printer Information:"
Write-Host "------------------------"
$printer = Get-Printer -Name $printerName -ErrorAction SilentlyContinue
if ($printer) {
    $printer | Format-List Name, PortName, DriverName, PrinterStatus
} else {
    Write-Host "Printer not found: $printerName"
    exit 1
}

Write-Host ""
Write-Host "2. Printer Driver Settings:"
Write-Host "---------------------------"
try {
    $driver = Get-PrinterDriver -Name $printer.DriverName -ErrorAction SilentlyContinue
    if ($driver) {
        $driver | Format-List Name, DriverType, Version
    }
} catch {
    Write-Host "Could not get driver info: $_"
}

Write-Host ""
Write-Host "3. Creating Test ZPL with EXPLICIT Orientation:"
Write-Host "-----------------------------------------------"

# Test ZPL - 58mm x 40mm landscape with explicit orientation commands
$testZPL = @"
^XA
^JMA
^JUS
^XZ
^XA
^PO0
^PW464
^LL320
^LH0,0
^CI28
^FWN
^CF0,20
^FO20,20^FD=== ORIENTATION TEST ===^FS
^FO20,50^FDWidth: 58mm (464 dots)^FS
^FO20,80^FDHeight: 40mm (320 dots)^FS
^FO20,110^FDThis should be HORIZONTAL^FS
^FO20,140^FDIf you see this VERTICALLY^FS
^FO20,170^FDPrinter settings are wrong^FS
^FO20,200^BY2
^FO20,230^BCN,50,N,N,N
^FD123456789^FS
^XZ
"@

$tempFile = "$env:TEMP\zpl_orientation_test_$(Get-Date -Format 'yyyyMMdd_HHmmss').zpl"
$testZPL | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline

Write-Host "Test ZPL saved to: $tempFile"
Write-Host ""
Write-Host "ZPL Content:"
Write-Host $testZPL
Write-Host ""

# 4. Send via .NET RawPrinterHelper (bypasses driver)
Write-Host "4. Sending ZPL via RawPrinterHelper (bypasses driver):"
Write-Host "------------------------------------------------------"

$psScript = @"
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
    [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string printerName, out IntPtr hPrinter, IntPtr printerDefaults);
    
    [DllImport("winspool.drv", SetLastError = true, ExactSpelling = true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);
    
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, [MarshalAs(UnmanagedType.LPStr)] string jobName, int level, IntPtr docInfo);
    
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);
    
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);
    
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);
    
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
}
"@

$fileContent = [System.IO.File]::ReadAllBytes('$tempFile')
$printerNameToUse = '$printerName'

$hPrinter = [IntPtr]::Zero
try {
    if ([RawPrinterHelper]::OpenPrinter($printerNameToUse, [ref]$hPrinter, [IntPtr]::Zero)) {
        Write-Host "SUCCESS: Opened printer"
        
        if ([RawPrinterHelper]::StartDocPrinter($hPrinter, "ZPL Orientation Test", 1, [IntPtr]::Zero)) {
            if ([RawPrinterHelper]::StartPagePrinter($hPrinter)) {
                $pBytes = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($fileContent.Length)
                [System.Runtime.InteropServices.Marshal]::Copy($fileContent, 0, $pBytes, $fileContent.Length)
                $dwWritten = 0
                
                $result = [RawPrinterHelper]::WritePrinter($hPrinter, $pBytes, $fileContent.Length, [ref]$dwWritten)
                
                [System.Runtime.InteropServices.Marshal]::FreeHGlobal($pBytes)
                [RawPrinterHelper]::EndPagePrinter($hPrinter)
                [RawPrinterHelper]::EndDocPrinter($hPrinter)
                
                if ($result) {
                    Write-Host "SUCCESS: Sent $dwWritten bytes to printer"
                    Write-Host "Check your printer - label should be HORIZONTAL"
                } else {
                    $errorCode = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
                    Write-Host "FAILED: WritePrinter returned false. Error code: $errorCode"
                }
            } else {
                Write-Host "FAILED: StartPagePrinter failed"
            }
        } else {
            Write-Host "FAILED: StartDocPrinter failed"
        }
        
        [RawPrinterHelper]::ClosePrinter($hPrinter)
    } else {
        $errorCode = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
        Write-Host "FAILED: OpenPrinter failed. Error code: $errorCode"
        Write-Host "Trying alternative printer name..."
        
        # Try without (EPL)
        $altName = $printerName -replace '\s*\(EPL\)\s*', ''
        if ([RawPrinterHelper]::OpenPrinter($altName, [ref]$hPrinter, [IntPtr]::Zero)) {
            Write-Host "SUCCESS: Opened printer with name: $altName"
            # Repeat print logic...
        }
    }
} catch {
    Write-Host "EXCEPTION: $_"
}
"@

$scriptFile = "$env:TEMP\print_raw_test.ps1"
$psScript -replace '\$tempFile', $tempFile -replace '\$printerName', $printerName | Out-File -FilePath $scriptFile -Encoding UTF8

Write-Host "Running print script..."
& $scriptFile

Write-Host ""
Write-Host "========================================"
Write-Host "Diagnostic Complete"
Write-Host "========================================"
Write-Host ""
Write-Host "IMPORTANT: Check your printer settings:"
Write-Host "1. Printer driver 'Printing Preferences' -> 'Options' tab:"
Write-Host "   - Orientation should be 'Landscape'"
Write-Host "   - Size should be 58.00 x 40.00 mm"
Write-Host ""
Write-Host "2. Printer driver 'Properties' -> 'Advanced' tab:"
Write-Host "   - Click 'Printing Defaults'"
Write-Host "   - Check orientation settings there too"
Write-Host ""
Write-Host "3. Physical printer settings (if accessible):"
Write-Host "   - Check for any DIP switches or menu settings"
Write-Host "   - Some printers have hardware orientation settings"
Write-Host ""
Write-Host "4. If still printing vertically:"
Write-Host "   - The printer driver may be processing ZPL"
Write-Host "   - Try uninstalling and reinstalling the printer driver"
Write-Host "   - Or use a generic 'RAW' printer driver instead"



