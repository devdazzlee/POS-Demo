# Fix Chrome Shortcut for Silent Printing

## ❌ Current (WRONG) Configuration

**Target field:**
```
iosk-printing --kiosk https://pos.manpasandstore.com
```

**Problems:**
- Missing Chrome executable path
- Missing `--k` at start (`iosk-printing` instead of `--kiosk-printing`)
- Windows doesn't know what program to run

---

## ✅ Correct Configuration

### Step 1: Fix Target Field

1. **Right-click shortcut** → **Properties**
2. **In "Target" field, paste EXACTLY this:**
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk https://pos.manpasandstore.com
   ```
   
   **Important points:**
   - Quotes around the Chrome path (required if path has spaces)
   - `--kiosk-printing` (with `--k` at start, NOT `iosk-printing`)
   - `--kiosk` (for fullscreen)
   - Your URL at the end

3. **In "Start in" field, paste:**
   ```
   "C:\Program Files\Google\Chrome\Application"
   ```

4. **Click OK**

---

## 🔍 Verification

After fixing, your Properties should show:

**Target:**
```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk https://pos.manpasandstore.com
```

**Start in:**
```
"C:\Program Files\Google\Chrome\Application"
```

---

## ✅ Test

1. **Close all Chrome windows**
2. **Double-click your fixed shortcut**
3. **Chrome should open:**
   - In fullscreen (no address bar)
   - Your POS app loaded
   
4. **Test printing:**
   - Complete a sale
   - Click Print
   - **Should print SILENTLY (no dialog!)**

---

## 🚨 If Print Dialog Still Appears

### Check 1: Shortcut Properties
- Make sure Target has **full path** to chrome.exe
- Make sure it's `--kiosk-printing` (with `--k`)

### Check 2: Using Correct Shortcut
- Don't use regular Chrome icon
- Must use the shortcut you created

### Check 3: Chrome Flags
- Some Chrome policies might override flags
- Check: `chrome://version/` in address bar
- Look for "Command Line" to see if flags are applied

### Check 4: Browser Default Printer
- Set your printer as Windows default
- Windows Settings → Printers → Set as default

---

## 📝 Alternative: Batch File Method

If shortcut keeps having issues, use a `.bat` file:

**Create `start-pos.bat`:**

```batch
@echo off
cd /d "C:\Program Files\Google\Chrome\Application"
start "" chrome.exe --kiosk-printing --kiosk https://pos.manpasandstore.com
```

**Save and double-click the `.bat` file**

---

## ✅ Summary

**Your Target field MUST have:**
1. ✅ Full path to chrome.exe (with quotes)
2. ✅ `--kiosk-printing` flag (not `iosk-printing`)
3. ✅ `--kiosk` flag (for fullscreen)
4. ✅ Your URL

**Current issue:** Target field is missing Chrome path and has truncated flag name.

**Fix:** Copy the exact command shown above into Target field.












