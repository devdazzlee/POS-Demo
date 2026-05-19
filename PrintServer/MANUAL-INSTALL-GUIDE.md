# Manual Installation Guide

If the batch files close too fast, follow these steps manually.

## Step-by-Step Manual Installation

### Step 1: Open Command Prompt as Administrator

1. Press `Win + X`
2. Select **"Windows Terminal (Admin)"** or **"Command Prompt (Admin)"**
3. Click **"Yes"** when asked for permission

### Step 2: Navigate to PrintServer Folder

```bash
cd "D:\Konain Bhai\Manpasand-Pos-\PrintServer"
```

### Step 3: Install node-windows (if not already installed)

```bash
npm install node-windows --save
```

*Note: You already have this installed, so you can skip this step.*

### Step 4: Install the Windows Service (RUN AS ADMINISTRATOR!)

**Important:** This step MUST be run as Administrator!

```bash
node install-service.js
```

**Expected output:**
```
✅ Print Server service installed successfully!
📋 Service will start automatically on Windows boot
🔄 Service will auto-restart if it crashes or closes
```

### Step 5: Verify Service Exists

```bash
sc query "Manpasand Print Server"
```

**If service exists, you'll see:**
```
SERVICE_NAME: Manpasand Print Server
        TYPE               : 10  WIN32_OWN_PROCESS
        STATE              : 1  STOPPED  (or RUNNING)
        ...
```

**If service doesn't exist, you'll see:**
```
[SC] EnumQueryServicesStatus FAILED 1060:
The specified service does not exist as an installed service.
```

**If you get error 1060:**
- The service installation failed (not run as Admin)
- Re-run `node install-service.js` **as Administrator**

### Step 6: Set Startup Type to Automatic

```bash
sc config "Manpasand Print Server" start= auto
```

**Expected output:**
```
[SC] ChangeServiceConfig SUCCESS
```

**If you get error 1060:**
- Service doesn't exist yet
- Go back to Step 4 (run as Administrator)

### Step 7: Start the Service

```bash
sc start "Manpasand Print Server"
```

**Expected output:**
```
SERVICE_NAME: Manpasand Print Server
        TYPE               : 10  WIN32_OWN_PROCESS
        STATE              : 2  START_PENDING
                ...
```

**If you get error 1060:**
- Service doesn't exist
- Go back to Step 4 (run as Administrator)

### Step 8: Check Service Status

```bash
sc query "Manpasand Print Server"
```

**Look for:**
```
STATE              : 4  RUNNING
```

### Step 9: Test the Server

Open browser and go to:
- http://localhost:3001/health
- http://localhost:3001/printers

**Or test with curl:**
```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{"status":"ok","printerInitialized":true,"timestamp":"..."}
```

---

## Common Issues and Solutions

### Issue 1: "Service does not exist" (Error 1060)

**Problem:** Service installation didn't work
**Solution:** Run `node install-service.js` **as Administrator**

### Issue 2: "Access Denied" or "Permission Denied"

**Problem:** Not running as Administrator
**Solution:** Right-click Command Prompt → Run as administrator

### Issue 3: Service Install Says "Success" But Service Doesn't Exist

**Problem:** Not enough permissions to create service
**Solution:**
1. Close all Command Prompts
2. Right-click Command Prompt → Run as administrator
3. Navigate to PrintServer folder
4. Run `node install-service.js` again

### Issue 4: Service Won't Start

**Check logs:**
1. Open Event Viewer (`eventvwr.msc`)
2. Go to: **Windows Logs** → **Application**
3. Look for errors from "Manpasand Print Server"

**Common causes:**
- Port 3001 in use: `netstat -ano | findstr :3001`
- Node.js path issue
- Missing dependencies: `npm install`

---

## Quick Command Reference

```bash
# Install service
node install-service.js

# Check if service exists
sc query "Manpasand Print Server"

# Set to automatic startup
sc config "Manpasand Print Server" start= auto

# Start service
sc start "Manpasand Print Server"

# Stop service
sc stop "Manpasand Print Server"

# Check status
sc query "Manpasand Print Server"

# Uninstall service
node uninstall-service.js
```

---

## Verification Checklist

After installation, verify:

- [ ] Service exists: `sc query "Manpasand Print Server"` shows service
- [ ] Startup type is Automatic: `sc qc "Manpasand Print Server"` shows `START_TYPE : 2 AUTO_START`
- [ ] Service is Running: `sc query` shows `STATE : 4 RUNNING`
- [ ] Server responds: `curl http://localhost:3001/health` returns JSON
- [ ] Printers endpoint works: `curl http://localhost:3001/printers` returns list

---

## Complete Installation Script (Copy-Paste)

Run these commands **one by one** in Command Prompt **as Administrator**:

```bash
cd "D:\Konain Bhai\Manpasand-Pos-\PrintServer"
node install-service.js
sc query "Manpasand Print Server"
sc config "Manpasand Print Server" start= auto
sc start "Manpasand Print Server"
timeout /t 5
sc query "Manpasand Print Server"
curl http://localhost:3001/health
```

---

## Next Steps After Installation

Once the service is running:

1. **Test it works:** http://localhost:3001/health
2. **Restart laptop** to verify auto-start works
3. **Check Services GUI:** `services.msc` → Find "Manpasand Print Server" → Should be "Running" and "Automatic"






