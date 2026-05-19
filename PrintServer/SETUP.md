# Print Server Setup Guide

## Quick Setup

1. **Navigate to PrintServer directory**
   ```bash
   cd PrintServer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Update printer name in `server.js`**
   - Find line: `interface: 'printer:BlackCopper 80mm Series'`
   - Replace with your Windows printer name

4. **Start the server**
   ```bash
   npm start
   ```

5. **Test the server**
   - Open: http://localhost:3001/health
   - Should return: `{"status":"ok","printerInitialized":true}`

## Auto-Start on Windows

### Option 1: Windows Startup Folder

1. Press `Win + R`
2. Type: `shell:startup`
3. Copy `start-print-server.bat` to that folder

### Option 2: Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Manpasand Print Server"
4. Trigger: "When the computer starts"
5. Action: "Start a program"
6. Program: `node.exe`
7. Arguments: Full path to `server.js`
8. Start in: Full path to `PrintServer` directory

## Architecture

```
┌─────────────────┐
│   Frontend      │
│  (Domain)       │
└────────┬────────┘
         │ HTTP Request
         │ (localhost:3001)
         ▼
┌─────────────────┐
│  Print Server   │
│  (Local)        │
│  Port: 3001     │
└────────┬────────┘
         │ Direct Print
         ▼
┌─────────────────┐
│   Printer       │
│ (USB/Network)   │
└─────────────────┘
```

## Benefits

- ✅ No browser print dialog
- ✅ Accurate paper height (no blank paper)
- ✅ Direct printer communication
- ✅ Works with any printer
- ✅ No Chrome flags needed
- ✅ Faster printing






