# Complete Fix Guide - Automatic Startup

## The Problem

Your print server service is installed but:
- ❌ Not starting automatically on boot
- ❌ Cannot be started manually (service executable issue)
- ❌ Requires manual intervention

## Root Cause

The service executable may be corrupted or the service wasn't configured properly during installation.

## Complete Solution (Run Once)

### Option 1: Automated Fix (Recommended)

1. **Right-click** `reinstall-service-fixed.ps1`
2. Select **"Run with PowerShell"** (as Administrator)
3. This will:
   - Uninstall the broken service
   - Reinstall it properly
   - Set startup type to Automatic
   - Configure recovery options
   - Start the service
   - Test it

**That's it!** After this, the service will start automatically on every boot.

### Option 2: Manual Fix Steps

If the automated script doesn't work, follow these steps:

#### Step 1: Uninstall Old Service

```powershell
# Run as Administrator
cd "D:\Konain Bhai\Manpasand-Pos-\PrintServer"
node uninstall-service.js
```

#### Step 2: Reinstall Service

```powershell
# Run as Administrator
node install-service.js
```

#### Step 3: Set Startup Type to Automatic

```powershell
# Run as Administrator
sc config "Manpasand Print Server" start= auto
```

#### Step 4: Configure Recovery (Auto-restart on failure)

```powershell
# Run as Administrator
sc failure "Manpasand Print Server" reset= 86400 actions= restart/60000/restart/60000/restart/60000
```

#### Step 5: Start Service

```powershell
# Run as Administrator
sc start "Manpasand Print Server"
```

#### Step 6: Verify

```powershell
sc query "Manpasand Print Server"
# Should show: STATE              : 4  RUNNING
# Should show: START_TYPE         : 2   AUTO_START
```

## Verification

After running the fix:

1. **Check Service Status:**
   - Open `services.msc`
   - Find "Manpasand Print Server"
   - Should show: **Status: Running**, **Startup type: Automatic**

2. **Test Server:**
   - Open browser: `http://localhost:3001/health`
   - Should see: `{"status":"ok",...}`

3. **Test Auto-Start:**
   - Restart your laptop (don't log in)
   - Wait for Windows to boot
   - Test: `http://localhost:3001/health`
   - Should work without any login!

## Troubleshooting

### Service Won't Start

**Check Event Viewer:**
1. Press `Win + R`
2. Type: `eventvwr.msc`
3. Go to: **Windows Logs** → **Application**
4. Look for errors from "Manpasand Print Server"

**Common Issues:**
- Port 3001 already in use → Kill the process using port 3001
- Node.js not in PATH → Reinstall Node.js or fix PATH
- Missing dependencies → Run `npm install` in PrintServer folder

### Service Not Starting Automatically

**Verify Startup Type:**
```powershell
sc qc "Manpasand Print Server" | findstr START_TYPE
# Should show: START_TYPE         : 2   AUTO_START
```

If it shows `3  DEMAND_START` (Manual):
```powershell
sc config "Manpasand Print Server" start= auto
```

### Service Starts But Stops Immediately

**Check logs in Event Viewer** - usually indicates:
- Error in server.js
- Missing dependencies
- Port conflict
- Permission issues

## Files Created

- `reinstall-service-fixed.ps1` - Complete automated fix
- `fix-auto-start.ps1` - Fix existing service configuration
- `COMPLETE-FIX-GUIDE.md` - This guide

## What's Fixed

✅ Service uninstalled and reinstalled properly
✅ Startup type set to Automatic
✅ Recovery options configured (auto-restart on failure)
✅ Service starts automatically on boot
✅ Works without user login
✅ No customer interaction needed

## After Fix

Your print server will:
- ✅ Start automatically when laptop boots
- ✅ Start even without user login
- ✅ Auto-restart if it crashes
- ✅ Run silently in background
- ✅ Be accessible at `http://localhost:3001`

**Test it:** Restart your laptop and check `http://localhost:3001/health`








