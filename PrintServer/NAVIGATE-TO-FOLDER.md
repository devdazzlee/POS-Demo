# How to Navigate to PrintServer Folder

When Command Prompt opens as Administrator, it starts in `C:\Users\Dell>` or `C:\Windows\System32>`.

## Quick Navigation Commands

Run these commands **one by one**:

### Step 1: Change to D Drive

```bash
D:
```

This switches to the D drive. You'll see:
```
D:\>
```

### Step 2: Navigate to PrintServer Folder

```bash
cd "Konain Bhai\Manpasand-Pos-\PrintServer"
```

Or the full path:
```bash
cd "D:\Konain Bhai\Manpasand-Pos-\PrintServer"
```

You'll see:
```
D:\Konain Bhai\Manpasand-Pos-\PrintServer>
```

### Step 3: Verify You're in the Right Folder

```bash
dir
```

You should see:
- `server.js`
- `install-service.js`
- `package.json`
- etc.

### Step 4: Now Install the Service

```bash
node install-service.js
```

---

## Complete Copy-Paste Commands

**Copy and paste these commands one by one:**

```bash
D:
cd "Konain Bhai\Manpasand-Pos-\PrintServer"
dir
node install-service.js
sc query "Manpasand Print Server"
sc config "Manpasand Print Server" start= auto
sc start "Manpasand Print Server"
sc query "Manpasand Print Server"
```

---

## Alternative: Use Full Path Directly

You can also navigate directly:

```bash
cd /d "D:\Konain Bhai\Manpasand-Pos-\PrintServer"
```

The `/d` flag changes both drive and directory in one command.

Then check:
```bash
dir
```

---

## Visual Guide

```
C:\Users\Dell>           ← You start here
D:                        ← Switch to D drive
D:\>                      ← Now you're on D drive
cd "Konain Bhai\Manpasand-Pos-\PrintServer"
D:\Konain Bhai\Manpasand-Pos-\PrintServer>   ← You're in the right folder!
```

---

## Quick Helper Script

I've also created `run-as-admin.bat` which opens Command Prompt as Admin in the right folder automatically.

But if you're already in Command Prompt, just use:
```bash
D:
cd "Konain Bhai\Manpasand-Pos-\PrintServer"
```

Then continue with the installation commands!






