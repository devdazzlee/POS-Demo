# Chrome Kiosk Printing Setup Guide

## What is `--kiosk-printing`?

Chrome's `--kiosk-printing` flag enables **silent printing** - it bypasses the print dialog and automatically prints to the default printer when `window.print()` is called.

## ✅ How to Configure

### **Method 1: Windows Desktop Shortcut (Easiest)**

1. **Create New Shortcut:**
   - Right-click on your desktop → New → Shortcut

2. **Set Target Path:**
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk https://manpasand-pos-t623.vercel.app
   ```

   **OR if Chrome is in a different location:**
   ```
   "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk https://manpasand-pos-t623.vercel.app
   ```

   **OR for full kiosk mode (no address bar, fullscreen):**
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk --disable-infobars https://manpasand-pos-t623.vercel.app
   ```

3. **Set Startup:**
   - Right-click the shortcut → Properties
   - In "Start in:" field, set: `"C:\Program Files\Google\Chrome\Application"`
   - Click OK

4. **Optional: Set as Startup Program:**
   - Press `Win + R` → type `shell:startup` → Enter
   - Copy your shortcut here to auto-start with Windows

---

### **Method 2: Windows Task Scheduler (Auto-start)**

1. Press `Win + R` → type `taskschd.msc` → Enter

2. **Create Basic Task:**
   - Right-click "Task Scheduler Library" → Create Basic Task

3. **Configure:**
   - Name: "POS Kiosk Chrome"
   - Trigger: When I log on
   - Action: Start a program
   - Program: `C:\Program Files\Google\Chrome\Application\chrome.exe`
   - Arguments: `--kiosk-printing --kiosk https://manpasand-pos-t623.vercel.app`
   - Start in: `C:\Program Files\Google\Chrome\Application`

4. **Check:**
   - ✅ "Run whether user is logged on or not"
   - ✅ "Run with highest privileges"
   - Click Finish

---

### **Method 3: Windows Registry (For All Users)**

1. Press `Win + R` → type `regedit` → Enter

2. **Navigate to:**
   ```
   HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
   ```

3. **Create New String Value:**
   - Right-click → New → String Value
   - Name: `POSChromeKiosk`
   - Value: `"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk https://manpasand-pos-t623.vercel.app`

4. **Restart** computer to apply

---

### **Method 4: Batch Script (Quick Setup)**

Create `start-pos.bat` file:

```batch
@echo off
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk --disable-infobars https://manpasand-pos-t623.vercel.app
```

**To use:** Double-click the `.bat` file

---

### **Method 5: PowerShell Script (Advanced)**

Create `start-pos.ps1`:

```powershell
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$appUrl = "https://manpasand-pos-t623.vercel.app"
$args = "--kiosk-printing", "--kiosk", "--disable-infobars", $appUrl

Start-Process -FilePath $chromePath -ArgumentList $args
```

**Run:** Right-click → Run with PowerShell

---

## 🔧 Chrome Flags Explanation

| Flag | Purpose |
|------|---------|
| `--kiosk-printing` | **Enables silent printing** - bypasses print dialog |
| `--kiosk` | Fullscreen mode, hides address bar |
| `--disable-infobars` | Hides Chrome info bars |
| `--disable-web-security` | ⚠️ Only if needed for development |
| `--disable-features=TranslateUI` | Disables translate popups |

---

## 📝 What You Need to Change in Your Code

### **Backend: NO CHANGES NEEDED**
- Already returns `[]` on Vercel ✅
- Kiosk printing works from browser, not server

### **Frontend: Use `window.print()`**

Your current code already uses `window.print()` which will work with kiosk mode. But you can enhance it:

```typescript
// In barcode-generater.tsx
const printWithBrowser = async () => {
  // In kiosk mode, this will print silently without dialog!
  window.print();
  
  // Optional: Show toast after print
  toast({
    title: "Printing",
    description: "Print job sent to default printer",
  });
};
```

---

## ✅ Testing Steps

1. **Setup Chrome with kiosk-printing flag**
2. **Open your POS app**
3. **Click "Print" button**
4. **Expected:** Print job goes directly to default printer - NO dialog!

---

## ⚠️ Important Considerations

### **Printer Selection:**
- Kiosk mode prints to **default printer only**
- User can't select different printer from dialog
- **Solution:** Add printer selection UI before printing

### **Best Practice:**
```typescript
// Add printer selection UI in your app
const [selectedPrinter, setSelectedPrinter] = useState('');
const [availablePrinters, setAvailablePrinters] = useState([]);

// Before printing, let user select (or use saved preference)
// Then call window.print() which uses their default printer
```

### **Alternative: Set Default Printer Before Printing**
```typescript
// User selects printer in UI
// System changes default printer (requires permissions)
// Then calls window.print()
```

---

## 🔒 Security & Deployment

### **For Production POS Terminals:**

1. **Lock Down Browser:**
   ```
   --kiosk-printing --kiosk --disable-infobars --disable-dev-shm-usage
   ```

2. **Disable Right-Click (Optional):**
   ```javascript
   // In your app
   document.addEventListener('contextmenu', e => e.preventDefault());
   ```

3. **Disable Keyboard Shortcuts:**
   ```javascript
   document.addEventListener('keydown', (e) => {
     // Block F12, Ctrl+Shift+I, etc.
     if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
       e.preventDefault();
     }
   });
   ```

---

## 🚀 Quick Setup Script

Save this as `setup-kiosk.ps1`:

```powershell
# Find Chrome Path
$chromePath = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe").'(default)'

if (-not $chromePath) {
    $chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
}

# Create Shortcut
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\POS Kiosk.lnk")
$Shortcut.TargetPath = $chromePath
$Shortcut.Arguments = "--kiosk-printing --kiosk --disable-infobars https://manpasand-pos-t623.vercel.app"
$Shortcut.WorkingDirectory = Split-Path $chromePath
$Shortcut.IconLocation = $chromePath
$Shortcut.Save()

Write-Host "Shortcut created on Desktop: POS Kiosk.lnk"
Write-Host "Double-click to start POS in kiosk mode with silent printing!"
```

**Run:** `powershell -ExecutionPolicy Bypass -File setup-kiosk.ps1`

---

## 📱 For Multiple Workstations

### **Option 1: Group Policy (Windows Domain)**
1. Open Group Policy Editor
2. Navigate to: Computer Configuration → Administrative Templates → Google → Google Chrome
3. Set startup flags via policy

### **Option 2: Deployment Script**
Create script to run on all POS terminals:
```powershell
# Deploy to all machines
Invoke-Command -ComputerName $computers -ScriptBlock {
    $chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
    # Create shortcut with kiosk flags
}
```

### **Option 3: Browser Extension**
- Create/manage Chrome extension that sets kiosk mode
- Deploy via Chrome policies

---

## 🎯 Recommended Setup for Your POS

1. **Create Desktop Shortcut** (Method 1) - Easiest
2. **Set as Startup Program** - Auto-launch on boot
3. **Set Default Printer** - One printer per workstation, or let user select in UI
4. **Test:** Click print button → Should print silently!

---

## ⚙️ Advanced: Multiple Printers

Since kiosk mode uses default printer, here's how to handle multiple printers:

```typescript
// Option 1: Let user change default printer (manual)
// Option 2: Use QZ Tray for printer selection
// Option 3: Use direct IP printing for each printer
```

**Best for your case:** Use kiosk printing for single printer per terminal, or combine with Direct IP printing for multiple printers.

---

## 📞 Troubleshooting

**Problem:** Print dialog still appears
- **Fix:** Make sure Chrome is launched with `--kiosk-printing` flag
- **Verify:** Chrome task should show the flag in command line

**Problem:** Wrong printer selected
- **Fix:** Set the correct default printer in Windows Settings
- **Or:** Add printer selection UI before printing

**Problem:** Chrome doesn't open in kiosk mode
- **Fix:** Check shortcut target path is correct
- **Fix:** Try full path with quotes: `"C:\Program Files\Google\Chrome\Application\chrome.exe"`

---

## ✅ Summary

1. **Create shortcut** with `--kiosk-printing` flag
2. **Set as startup** if needed
3. **Set default printer** per workstation
4. **Use `window.print()`** in your app
5. **Done!** Silent printing works! 🎉












