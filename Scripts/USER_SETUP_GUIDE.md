# Setup Guide for Each POS Terminal User

## 📋 What Each Person Needs to Do

Each person who will use the POS system needs to configure their browser ONE TIME to enable silent printing.

---

## 🎯 Quick Setup (5 Minutes Per Computer)

### **Step 1: Find Chrome Location**

**Check where Chrome is installed:**

1. Open File Explorer
2. Go to: `C:\Program Files\Google\Chrome\Application\`
   - OR `C:\Program Files (x86)\Google\Chrome\Application\`
3. Look for `chrome.exe` file
4. **Copy the full path** (Example: `C:\Program Files\Google\Chrome\Application\chrome.exe`)

**OR Easier Method:**
- Right-click Chrome icon on Desktop → Properties
- Look at "Target" field - copy that path (without quotes)

---

### **Step 2: Create Shortcut**

1. **Right-click on Desktop** → New → Shortcut

2. **In "Location of the item" field, paste this:**
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk https://manpasand-pos-t623.vercel.app
   ```
   
   **⚠️ IMPORTANT:** Replace the path if Chrome is in different location!
   
   **Examples:**
   - If Chrome in Program Files (x86):
   ```
   "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk https://manpasand-pos-t623.vercel.app
   ```
   
   - If Chrome in custom location:
   ```
   "D:\Programs\Chrome\Application\chrome.exe" --kiosk-printing --kiosk https://manpasand-pos-t623.vercel.app
   ```

3. Click **Next**

4. Name it: **"POS App"** or **"Manpasand POS"**

5. Click **Finish**

---

### **Step 3: Set Default Printer**

**IMPORTANT:** Each computer must have the correct printer set as Windows default!

1. Press `Win + I` (Windows Settings)

2. Go to: **Devices** → **Printers & scanners**

3. **Find your receipt/label printer** in the list

4. Click on it → **Manage**

5. Click **"Set as default"**

6. ✅ Done! This printer will now be used automatically

**OR:**

- Open **Control Panel** → **Devices and Printers**
- Right-click your printer → **Set as default printer**

---

### **Step 4: Test**

1. **Double-click the new shortcut** you created

2. Chrome should open in **fullscreen mode** (no address bar)

3. You should see your POS app

4. **Test printing:**
   - Add items to cart
   - Click Print/Checkout
   - **Should print automatically WITHOUT any dialog!**

---

## 📝 Step-by-Step for Each Person

### **For Computer 1 (Cashier 1):**

1. ✅ Create shortcut with kiosk flag
2. ✅ Set their printer as default (example: "Receipt Printer 1")
3. ✅ Test printing
4. ✅ Done!

### **For Computer 2 (Cashier 2):**

1. ✅ Create shortcut with kiosk flag
2. ✅ Set their printer as default (example: "Receipt Printer 2")
3. ✅ Test printing
4. ✅ Done!

### **And so on for each terminal...**

---

## ⚙️ Optional: Auto-Start on Boot

**If you want POS to open automatically when computer starts:**

1. **Press `Win + R`**

2. **Type:** `shell:startup` → Press Enter

3. **Copy your shortcut** into this folder

4. **Done!** POS will auto-open on startup

---

## 🔧 Alternative: Batch File (Easier for Non-Technical Users)

**Create a `.bat` file instead of shortcut:**

1. **Create new text file** on Desktop
2. **Rename it to:** `Start POS.bat` (change .txt to .bat)
3. **Right-click → Edit**
4. **Paste this:**
   ```batch
   @echo off
   start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk https://manpasand-pos-t623.vercel.app
   ```
5. **Save and close**
6. **Double-click the .bat file** to start POS

**Advantage:** Easier to modify if Chrome path changes

---

## 🖨️ Setting Up Multiple Printers

### **Scenario 1: One Printer Per Terminal**
- ✅ Each computer sets its own printer as default
- ✅ No changes needed in the app
- ✅ Works perfectly!

### **Scenario 2: Same Printer for All**
- ✅ Set that printer as default on all computers
- ✅ Works perfectly!

### **Scenario 3: Need to Change Printer**
**If user needs to switch printers:**

1. **Close POS app**
2. **Go to Windows Settings** → Printers
3. **Set different printer as default**
4. **Restart POS app**
5. ✅ New printer will be used

**OR:**
- User can click **Print** → **Change** in print dialog (if kiosk mode disabled temporarily)

---

## 📋 Checklist for Each Terminal

**Before going live, check on each computer:**

- [ ] Chrome is installed
- [ ] Shortcut created with `--kiosk-printing` flag
- [ ] Correct printer set as Windows default
- [ ] Test print works (no dialog appears)
- [ ] POS app opens in fullscreen
- [ ] (Optional) Added to startup folder

---

## 🎯 What Users See vs. What Admin Does

### **What End Users See:**
- Just double-click "POS App" shortcut
- App opens automatically
- Print works silently
- **Simple!**

### **What Admin/IT Needs to Do:**
1. Install Chrome on each computer (if not installed)
2. Create shortcut with kiosk flags
3. Set up printers as default
4. Test on each terminal
5. (Optional) Add to startup

---

## 🚨 Common Issues & Solutions

### **Issue 1: Print dialog still appears**

**Solution:**
- Check shortcut target has `--kiosk-printing` flag
- Make sure launching from shortcut (not regular Chrome)
- Restart Chrome

### **Issue 2: Wrong printer prints**

**Solution:**
- Change Windows default printer
- Restart POS app

### **Issue 3: Chrome not found**

**Solution:**
- Install Google Chrome
- Or find correct Chrome path
- Update shortcut

### **Issue 4: App doesn't open in fullscreen**

**Solution:**
- Make sure shortcut has `--kiosk` flag
- Launch from shortcut, not browser

---

## 📱 Simplified Instructions for Non-Technical Staff

**Give this to your cashiers:**

> **How to Start POS:**
> 
> 1. Double-click **"POS App"** icon on desktop
> 2. App opens automatically
> 3. Just use the app normally
> 
> **If printing doesn't work:**
> - Tell the manager/IT person
> 
> **That's it!** ✅

---

## 🔄 Deployment Script (For IT/Admin)

**If you have many terminals, use this PowerShell script:**

```powershell
# Deploy to all computers on network
$computers = @("PC01", "PC02", "PC03") # Add your computer names

foreach ($comp in $computers) {
    Invoke-Command -ComputerName $comp -ScriptBlock {
        $chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
        $shortcutPath = "$env:PUBLIC\Desktop\POS App.lnk"
        
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($shortcutPath)
        $Shortcut.TargetPath = $chromePath
        $Shortcut.Arguments = "--kiosk-printing --kiosk https://manpasand-pos-t623.vercel.app"
        $Shortcut.WorkingDirectory = Split-Path $chromePath
        $Shortcut.Save()
    }
}
```

---

## ✅ Summary

**For Each Person/Computer:**

1. **Create shortcut** with Chrome + kiosk flags (5 min)
2. **Set printer as default** (2 min)
3. **Test printing** (1 min)
4. **Done!** (Total: ~8 minutes per terminal)

**After setup:**
- Users just double-click shortcut
- App opens automatically
- Printing works silently
- No technical knowledge needed!

---

## 🆘 Need Help?

**Contact IT/Admin if:**
- Chrome path is different
- Printer not found
- Print dialog still appears
- Need to change printer

**IT/Admin can:**
- Use batch script for quick setup
- Use PowerShell for bulk deployment
- Configure via Group Policy (for Windows domain)












