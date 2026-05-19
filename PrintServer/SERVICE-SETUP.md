# Windows Service Setup Guide

This guide explains how to install the Manpasand Print Server as a Windows service that:
- ✅ Starts automatically when Windows boots
- ✅ Automatically restarts if it crashes or closes
- ✅ Runs in the background without user interaction

## Two Methods Available

### Method 1: Windows Service (Recommended)
Uses `node-windows` to create a native Windows service. Best for production use.

### Method 2: PM2 (Alternative)
Uses PM2 process manager. Good if you prefer PM2's features.

---

## Method 1: Windows Service (Recommended)

### Step 1: Install node-windows

```bash
npm install node-windows --save
```

Or use the batch file:
```bash
install-service.bat
```

### Step 2: Install as Windows Service

**Option A: Using Batch File (Easiest)**
1. Right-click `install-service.bat`
2. Select "Run as administrator"
3. Follow the prompts

**Option B: Using Command Line**
```bash
# Right-click Command Prompt → Run as administrator
cd PrintServer
node install-service.js
```

### Step 3: Verify Installation

1. Open **Services** (Press `Win + R`, type `services.msc`)
2. Look for **"Manpasand Print Server"**
3. Status should be **"Running"** (or "Stopped" if not started yet)
4. Startup type should be **"Automatic"**

### Step 4: Start the Service

**Option A: Using Services GUI**
1. Open Services (`services.msc`)
2. Find "Manpasand Print Server"
3. Right-click → Start

**Option B: Using Command Line**
```bash
node start-service.js
```

**Option C: Using Batch File**
```bash
start-service.bat
```

### Managing the Service

**Start Service:**
```bash
node start-service.js
# or
start-service.bat
```

**Stop Service:**
```bash
node stop-service.js
# or in Services GUI: Right-click → Stop
```

**Uninstall Service:**
```bash
node uninstall-service.js
# or
uninstall-service.bat
```

**Check Service Status:**
- Open Services (`services.msc`)
- Look for "Manpasand Print Server"

---

## Method 2: PM2 (Alternative)

### Step 1: Install PM2

```bash
npm install -g pm2
```

### Step 2: Start with PM2

```bash
pm2 start pm2-ecosystem.config.js
```

### Step 3: Save PM2 Configuration

```bash
pm2 save
```

### Step 4: Setup PM2 to Start on Windows Boot

```bash
pm2 startup
```

This will show a command. Copy and run it as Administrator.

### Managing with PM2

**Start:**
```bash
pm2 start manpasand-print-server
```

**Stop:**
```bash
pm2 stop manpasand-print-server
```

**Restart:**
```bash
pm2 restart manpasand-print-server
```

**Status:**
```bash
pm2 status
```

**Logs:**
```bash
pm2 logs manpasand-print-server
```

**Remove from PM2:**
```bash
pm2 delete manpasand-print-server
```

---

## Service Properties

After installation, the service will have these properties:

- **Name:** Manpasand Print Server
- **Startup Type:** Automatic (starts on boot)
- **Recovery:** Automatic restart on failure
- **User:** System account (runs in background)

---

## Troubleshooting

### Service Won't Install

**Error:** "Access Denied" or "Requires Administrator"
- **Solution:** Run Command Prompt or PowerShell as Administrator
- Right-click → "Run as administrator"

### Service Installs But Won't Start

**Error:** Service starts then immediately stops
- **Solution:** Check logs in Event Viewer:
  1. Open Event Viewer (`eventvwr.msc`)
  2. Windows Logs → Application
  3. Look for errors from "Manpasand Print Server"

**Common Issues:**
- Port 3001 already in use
- Node.js not in PATH
- Missing dependencies

### Service Not Starting on Boot

**Check:**
1. Open Services (`services.msc`)
2. Find "Manpasand Print Server"
3. Check "Startup type" is set to "Automatic"
4. Right-click → Properties → Startup type: Automatic

### Port Already in Use

**Error:** "Port 3001 is already in use"
- **Solution:** Stop the service or change port in `server.js`
- Or kill the process using port 3001:
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Check Service Logs

**Windows Service:**
- Event Viewer → Windows Logs → Application
- Look for "Manpasand Print Server" events

**PM2:**
```bash
pm2 logs manpasand-print-server
```

---

## Uninstalling

### Windows Service

```bash
node uninstall-service.js
# or
uninstall-service.bat
```

Then in Services GUI:
1. Open Services (`services.msc`)
2. Find "Manpasand Print Server"
3. Right-click → Stop
4. Right-click → Delete (if option available)

### PM2

```bash
pm2 delete manpasand-print-server
pm2 save
```

---

## Quick Start (TL;DR)

### Windows Service Method:

```bash
# 1. Install node-windows
npm install node-windows --save

# 2. Install service (as Administrator)
node install-service.js

# 3. Start service
node start-service.js
```

Done! Service will now:
- ✅ Start automatically on boot
- ✅ Auto-restart if it crashes
- ✅ Run in background

---

## Testing

After installation, test the service:

1. **Check if running:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Get printers:**
   ```bash
   curl http://localhost:3001/printers
   ```

3. **Or use browser:**
   ```
   http://localhost:3001/health
   http://localhost:3001/printers
   ```

---

## Notes

- The service runs even when no user is logged in
- It will restart automatically if Windows restarts
- No user interaction needed after initial setup
- Logs are available in Event Viewer (Windows Service) or PM2 logs (PM2 method)






