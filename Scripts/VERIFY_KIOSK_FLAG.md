# Verify Chrome Kiosk Printing Flag is Working

## Step 1: Verify Flag is Applied

1. **Close ALL Chrome windows completely**
2. **Launch Chrome from your shortcut** (with `--kiosk-printing`)
3. **Press `F12`** to open Developer Tools (if in kiosk mode, may need to use `Ctrl+Shift+I`)
4. **Go to Console tab**
5. **Type this and press Enter:**
   ```javascript
   window.print()
   ```
6. **Result:**
   - ✅ **If prints silently** → Flag is working! Issue is in code
   - ❌ **If dialog appears** → Flag is NOT applied, shortcut is wrong

---

## Step 2: Check Chrome Version Page

1. **In Chrome, type:** `chrome://version/`
2. **Look for "Command Line" section**
3. **Should see:** `--kiosk-printing --kiosk`

**If you DON'T see the flags:**
- Shortcut is wrong
- Chrome is launching from different path
- Need to recreate shortcut

---

## Step 3: Quick Test Script

Create a test HTML file to verify:

**test-print.html:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Print</title>
</head>
<body>
    <h1>Test Print Page</h1>
    <p>This should print silently in kiosk mode</p>
    <script>
        window.onload = () => {
            setTimeout(() => {
                window.print();
            }, 1000);
        };
    </script>
</body>
</html>
```

**Open this file in Chrome with kiosk flag:**
```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --kiosk file:///C:/path/to/test-print.html
```

**If dialog appears** → Flag not working
**If prints silently** → Flag works!











