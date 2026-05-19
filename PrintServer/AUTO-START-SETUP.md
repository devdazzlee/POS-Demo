# Automatic Startup Setup - No Customer Interaction

This guide explains how to ensure your print server starts automatically when your laptop boots **WITHOUT any customer interaction**.

## ✅ Quick Setup (One-Time) - Recommended

### Option 1: One-Click Setup (Easiest)

1. **Right-click** `enable-auto-start.bat`
2. Select **"Run as administrator"**
3. The script will:
   - Set service startup type to **AUTOMATIC**
   - Start the service now
   - Verify everything is configured correctly

**That's it!** After this, the service will start automatically on every boot.

### Option 2: Detailed Setup Script

1. **Right-click** `set-auto-start-silent.bat`
2. Select **"Run as administrator"**
3. Follow the prompts (one-time only)

**That's it!** After this, the service will start automatically on every boot.

### Option 3: Manual Configuration

1. Press `Win + R`
2. Type: `services.msc`
3. Press Enter
4. Find **"Manpasand Print Server"**
5. Right-click → **Properties**
6. Set **Startup type:** to **"Automatic"**
7. Click **OK**

## 🔍 Verify Automatic Startup

### Method 1: Check in Services

1. Open `services.msc`
2. Find **"Manpasand Print Server"**
3. Check:
   - **Status:** Should be **"Running"** ✅
   - **Startup Type:** Should be **"Automatic"** ✅

### Method 2: Command Line

```bash
sc qc "Manpasand Print Server"
```

Look for:
```
START_TYPE         : 2   AUTO_START   ✅
```

### Method 3: Test After Reboot

1. Restart your laptop
2. **Don't log in** (just let Windows boot)
3. Open browser on another device
4. Go to: `http://YOUR-LAPTOP-IP:3001/health`
5. If you see `{"status":"ok"}`, auto-start is working! ✅

## 🚀 How It Works

When Windows boots:
1. Windows checks for services with **Startup Type = Automatic**
2. Windows finds **"Manpasand Print Server"**
3. Windows **automatically starts** the service
4. **No login required!** Service runs in background
5. Print server is ready to receive print requests

## 📝 Important Notes

- ✅ Service starts **before** user login
- ✅ Service runs in **background** (no windows/UI)
- ✅ **No customer interaction** needed
- ✅ Works even if laptop is on login screen
- ✅ Automatically restarts if service crashes

## 🛠️ Troubleshooting

### Service Not Starting Automatically

**Solution:**
1. Run `set-auto-start-silent.bat` as Administrator
2. Or manually set startup type:
   ```bash
   sc config "Manpasand Print Server" start= auto
   ```

### Service Stopped After Reboot

**Check:**
1. Open Event Viewer (`eventvwr.msc`)
2. Go to: **Windows Logs** → **Application**
3. Look for errors from "Manpasand Print Server"

**Common Issues:**
- Port 3001 already in use
- Node.js not in PATH
- Missing dependencies

**Fix:**
1. Run `auto-fix-and-start.bat` as Administrator
2. Or check logs in Event Viewer

## 🔧 Optional: Task Scheduler Setup (Extra Safety Net)

If you want an extra layer of protection, you can also set up a Task Scheduler task that ensures the service is running:

1. **Right-click** `setup-task-scheduler.ps1`
2. Select **"Run with PowerShell"** (as Administrator)
3. This creates a task that:
   - Runs automatically on boot
   - Ensures service is set to automatic
   - Starts the service if it's not running
   - Runs as SYSTEM (no login needed)

**Note:** This is optional. The Windows Service itself should start automatically if configured correctly.

## ✅ Summary

After running `enable-auto-start.bat` **once**:
- ✅ Service starts automatically on boot
- ✅ No customer interaction needed
- ✅ Works without user login
- ✅ Runs silently in background
- ✅ Automatically restarts if it crashes

**Test it:** Restart your laptop and check `http://localhost:3001/health`

## 📋 Files Created

- `enable-auto-start.bat` - One-click setup (recommended)
- `set-auto-start-silent.bat` - Detailed setup script
- `ensure-auto-start.bat` - Silent verification script (used by Task Scheduler)
- `setup-task-scheduler.ps1` - Optional Task Scheduler setup

