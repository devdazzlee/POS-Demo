# Deploy Print Server to New Laptop

## What Files You Need to Copy

Copy these **ENTIRE FOLDERS** to the new laptop:
1. **PrintServer** folder (entire folder with all contents)

## Required Files in PrintServer Folder

The PrintServer folder should contain:
- `server.js` - The print server code
- `package.json` - Node.js dependencies
- `install-service.js` - Service installer
- `uninstall-service.js` - Service uninstaller
- `node_modules/` - Dependencies (OR run `npm install` on new laptop)
- **All other files** - Keep the folder structure intact

## Setup Steps on New Laptop

### Step 1: Install Node.js (if not installed)

1. Download Node.js from https://nodejs.org/
2. Install it (make sure to add to PATH)
3. Verify: Open Command Prompt and type `node --version`

### Step 2: Copy PrintServer Folder

1. Copy the entire `PrintServer` folder to the new laptop
2. Place it in the same location or any location you prefer
3. Example: `D:\Konain Bhai\Manpasand-Pos-\PrintServer`

### Step 3: Install Dependencies

1. Open Command Prompt (or PowerShell) in the PrintServer folder
2. Run: `npm install`
3. Wait for dependencies to install

### Step 4: Install Windows Service (One-Time Setup)

**Choose ONE of these methods:**

#### Method 1: Automated Setup (Recommended)

1. **Right-click** `install-and-start.bat`
2. Select **"Run as administrator"**
3. Wait for installation to complete
4. The script will:
   - Install node-windows
   - Install the service
   - Set startup type to Automatic
   - Start the service
   - Test it

#### Method 2: Manual Setup (If Method 1 fails)

1. **Right-click** `install-service.js`
2. Select **"Run with Node.js"** (as Administrator)
   - OR open PowerShell as Admin and run: `node install-service.js`
3. Wait for installation
4. Then run: `ensure-service-auto-start.ps1` as Administrator

## Files to Run (In Order)

### First Time Setup:

1. **`install-and-start.bat`** (Run as Administrator)
   - This is the MAIN file to run
   - It does everything automatically
   - Installs service and configures automatic startup

### If `install-and-start.bat` Doesn't Work:

2. **`reinstall-service-fixed.ps1`** (Run as Administrator)
   - Alternative installation method
   - More detailed error messages

### After Installation (Optional - For Verification):

3. **`ensure-service-auto-start.ps1`** (Run as Administrator)
   - Verifies automatic startup is configured
   - Fixes any configuration issues
   - Ensures service starts on boot

## Quick Setup Summary

**On a new laptop, run this ONE file:**

```
Right-click: install-and-start.bat → Run as administrator
```

That's it! The service will be installed and configured to start automatically.

## Verification

After running the setup:

1. **Check Service Status:**
   - Press `Win + R`
   - Type: `services.msc`
   - Find "Manpasand Print Server"
   - Should show: **Status: Running**, **Startup type: Automatic**

2. **Test Server:**
   - Open browser
   - Go to: `http://localhost:3001/health`
   - Should see: `{"status":"ok",...}`

3. **Test Auto-Start:**
   - Restart laptop (don't log in)
   - Wait for Windows to boot
   - Test: `http://localhost:3001/health`
   - Should work without login!

## Troubleshooting

### Service Not Installing

1. Make sure Node.js is installed: `node --version`
2. Make sure you're running as Administrator
3. Check if port 3001 is available
4. Run: `npm install` first

### Service Not Starting Automatically

1. Run: `ensure-service-auto-start.ps1` as Administrator
2. Or manually set in Services (services.msc):
   - Right-click service → Properties
   - Set Startup type: **Automatic**
   - Click OK

### Dependencies Missing

If `npm install` fails:
1. Make sure Node.js is installed
2. Check internet connection
3. Try: `npm install --verbose` to see errors

## File Structure on New Laptop

```
D:\Konain Bhai\Manpasand-Pos-\PrintServer\
├── server.js                    ← Main server file
├── package.json                 ← Dependencies list
├── install-service.js           ← Service installer
├── uninstall-service.js        ← Service uninstaller
├── install-and-start.bat        ← ⭐ RUN THIS (Main setup)
├── reinstall-service-fixed.ps1  ← Alternative setup
├── ensure-service-auto-start.ps1← Verification/fix script
├── node_modules/                ← Dependencies (install with npm install)
└── (other files...)
```

## Summary

**To deploy on a new laptop:**

1. Copy entire `PrintServer` folder
2. Install Node.js (if needed)
3. Run `npm install` in PrintServer folder
4. **Right-click `install-and-start.bat` → Run as administrator**
5. Done! Service will start automatically on boot

**That's all you need!** Just one file to run: `install-and-start.bat`







