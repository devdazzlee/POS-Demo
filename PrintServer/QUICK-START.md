# Quick Start Guide

## ✅ After Running `install-service.bat`

If you ran `install-service.bat` successfully, the service should now be:
- ✅ Installed as Windows Service
- ✅ Started and running
- ✅ Set to start automatically on boot

## Next Steps

### Step 1: Verify Service is Running

**Option A: Check in Services (Visual)**
1. Press `Win + R`
2. Type: `services.msc`
3. Press Enter
4. Find **"Manpasand Print Server"** in the list
5. Check:
   - **Status** should be: **"Running"** ✅
   - **Startup Type** should be: **"Automatic"** ✅

**Option B: Test with Browser**
1. Open browser
2. Go to: `http://localhost:3001/health`
3. You should see: `{"status":"ok","printerInitialized":true,"timestamp":"..."}` ✅

**Option C: Test Printers Endpoint**
1. Open browser
2. Go to: `http://localhost:3001/printers`
3. You should see a list of printers ✅

### Step 2: You're Done! ✅

If the service is running, you're all set! The service will:
- ✅ Start automatically when Windows boots
- ✅ Auto-restart if it crashes
- ✅ Run in the background (no user interaction)

## Managing the Service

### Start Service (if stopped)
```bash
start-service.bat
# or
node start-service.js
```

### Stop Service
```bash
stop-service.bat
# or
node stop-service.js
```

### Check Status
```bash
# Open Services GUI
Win + R → services.msc
```

### Uninstall Service (if needed)
```bash
uninstall-service.bat
# or
node uninstall-service.js
```

## Troubleshooting

### Service Not Running

**If Status shows "Stopped":**
1. Right-click **"Manpasand Print Server"** in Services
2. Select **Start**

Or use command:
```bash
start-service.bat
```

### Service Won't Start

**Check Logs:**
1. Open Event Viewer (`Win + R` → `eventvwr.msc`)
2. Go to: **Windows Logs** → **Application**
3. Look for errors from "Manpasand Print Server"

**Common Issues:**
- Port 3001 already in use
- Node.js not in PATH
- Missing dependencies

**Solution:**
1. Check if another process is using port 3001:
   ```bash
   netstat -ano | findstr :3001
   ```
2. Kill the process if needed:
   ```bash
   taskkill /PID <PID> /F
   ```

### Startup Type Not Automatic

**Fix:**
1. Open Services (`services.msc`)
2. Find "Manpasand Print Server"
3. Right-click → **Properties**
4. Set **Startup type:** to **Automatic**
5. Click **OK**

## Testing Auto-Start

To verify auto-start works:
1. Restart your laptop
2. Wait for Windows to boot
3. Don't log in yet
4. Open browser on another device
5. Go to: `http://YOUR-LAPTOP-IP:3001/health`
6. If you see `{"status":"ok"}`, auto-start is working! ✅

## Summary

**After running `install-service.bat`:**
- ✅ Service is installed
- ✅ Service should be running
- ✅ Service will start automatically on boot

**No need to run any JS files manually!** The service runs automatically.

**Only run JS files if:**
- You want to start/stop the service manually
- You want to uninstall the service
- Something went wrong during installation






