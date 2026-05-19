# Fix: Chrome Not Launching with Kiosk Flags

## ❌ Problem Found

Your `chrome://version/` shows:
```
Command Line: "C:\Program Files\Google\Chrome\Application\chrome.exe" --no-startup-window /prefetch:5 ...
```

**Missing:** `--kiosk-printing --kiosk` flags!

This means Chrome is NOT using your shortcut, or Chrome is already running and opening tabs instead.

---

## ✅ Solutions

### **Solution 1: Make Sure You're Using the Shortcut (Most Important!)**

1. **Close ALL Chrome windows completely**
   - Click X on all Chrome windows
   - Check Task Manager (`Ctrl+Shift+Esc`)
   - End any `chrome.exe` processes

2. **Launch Chrome ONLY from your shortcut**
   - Double-click your shortcut
   - Don't use taskbar icon
   - Don't use Start menu Chrome icon
   - MUST use the shortcut you created!

3. **Verify flags:**
   - Open `chrome://version/`
   - Should now see `--kiosk-printing --kiosk` in Command Line

---

### **Solution 2: Fix Shortcut Again**

**Recreate the shortcut properly:**

1. **Delete old shortcut**

2. **Create new shortcut:**
   - Right-click Desktop → New → Shortcut

3. **Paste EXACTLY this (all on ONE line):**
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk https://pos.manpasandstore.com
   ```

4. **Click Next → Name it "POS App" → Finish**

5. **Right-click shortcut → Properties**

6. **In "Start in" field:**
   ```
   "C:\Program Files\Google\Chrome\Application"
   ```

7. **Click OK**

---

### **Solution 3: Prevent Chrome from Auto-Launching**

**Issue:** Chrome might be auto-starting from Windows, which bypasses your shortcut.

**Fix:**
1. Press `Win + R` → Type `msconfig` → Enter
2. Go to **Startup** tab
3. **Disable any Chrome entries**
4. Restart computer
5. Use ONLY your shortcut to launch Chrome

---

### **Solution 4: Use Batch File (Most Reliable)**

**Create `start-pos.bat` file:**

```batch
@echo off
taskkill /F /IM chrome.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk https://pos.manpasandstore.com
```

**This will:**
- Kill any existing Chrome processes
- Wait 2 seconds
- Launch Chrome with correct flags

**Use this `.bat` file instead of shortcut!**

---

## 🧪 Test After Fix

1. **Kill all Chrome:**
   - Press `Ctrl+Shift+Esc` → End all `chrome.exe` processes

2. **Launch from shortcut/batch file**

3. **Check flags:**
   - Go to `chrome://version/`
   - **Command Line should show:**
     ```
     "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk https://pos.manpasandstore.com ...
     ```

4. **Test print:**
   - Press `F12` → Console → Type `window.print()`
   - **Should print silently!**

---

## ⚠️ Common Issues

### **Issue 1: Chrome Already Running**
- **Problem:** Opening shortcut opens new tab in existing Chrome (without flags)
- **Fix:** Kill all Chrome processes first, then launch shortcut

### **Issue 2: Taskbar Icon Launching Chrome**
- **Problem:** Clicking taskbar Chrome icon doesn't use shortcut flags
- **Fix:** Use ONLY your shortcut, unpin Chrome from taskbar

### **Issue 3: Windows Startup Launching Chrome**
- **Problem:** Windows auto-starts Chrome without flags
- **Fix:** Disable Chrome from startup apps

---

## ✅ Quick Fix Command

**Create `restart-pos.bat`:**

```batch
@echo off
echo Killing all Chrome processes...
taskkill /F /IM chrome.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo Launching POS with kiosk flags...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk https://pos.manpasandstore.com
echo Done!
pause
```

**Use this file to always launch Chrome correctly!**











