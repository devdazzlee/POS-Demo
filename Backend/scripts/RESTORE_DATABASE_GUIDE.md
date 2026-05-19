# Database Restoration Guide - Restore to 2 Days Ago

## Your Database: Neon PostgreSQL

Neon PostgreSQL supports **Time-Travel** (branching), which allows you to restore your database to any point in time. This is the best way to restore your database to 2 days ago.

---

## Option 1: Using Neon Dashboard (Recommended - Easiest)

### Step 1: Access Neon Console
1. Go to: **https://console.neon.tech/**
2. Log in with your account
3. Select your project

### Step 2: Create a Time-Travel Branch
1. In your project, click on **"Branches"** in the left sidebar
2. Click **"Create Branch"** or **"New Branch"**
3. Select **"Create from point in time"** or **"Time-travel"**
4. Choose a date/time from **2 days ago** (e.g., March 14, 2026)
5. Give it a name like `restore-2-days-ago`
6. Click **"Create"**

### Step 3: Get the Branch Connection String
1. Once the branch is created, click on it
2. Go to **"Connection Details"** or **"Settings"**
3. Copy the **Connection String** (it will be different from your main branch)

### Step 4: Update Your Application
1. Update your `.env` file with the new connection string:
   ```bash
   DATABASE_URL="postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
   ```

2. Or temporarily use this branch for testing

### Step 5: Verify Data
1. Run your application
2. Check that your data is restored to 2 days ago
3. If everything looks good, you can:
   - **Option A**: Keep using this branch (update DATABASE_URL permanently)
   - **Option B**: Export data from this branch and import to main branch

---

## Option 2: Using Neon CLI (Advanced)

If you have Neon CLI installed:

```bash
# Install Neon CLI (if not installed)
npm install -g neonctl

# Login
neonctl auth

# Create a branch from point in time
neonctl branches create \
  --project-id YOUR_PROJECT_ID \
  --name restore-2-days-ago \
  --parent-id main \
  --point-in-time "2026-03-14T00:00:00Z"
```

---

## Option 3: Quick Fix - Restore Only Product Images

If you only need to fix the product images (not the entire database), you can run:

```bash
cd Backend
npx ts-node scripts/restore-correct-images-from-backup.ts
```

This will restore the correct product images from the backup data we have.

---

## Option 4: Manual SQL Export/Import

If you have access to another database or backup:

### Export from Backup Database:
```bash
pg_dump -h HOST -U USER -d DATABASE -F c -f backup.dump
```

### Import to Current Database:
```bash
pg_restore -h HOST -U USER -d DATABASE --clean --if-exists backup.dump
```

---

## Important Notes

⚠️ **Before Restoring:**
- Make sure you have a backup of your current database (just in case)
- Note down any important data you added today that you want to keep
- Consider exporting current data first

✅ **After Restoring:**
- Verify all your data is correct
- Check that all products, categories, and images are restored
- Test your application thoroughly

---

## Need Help?

If you're having trouble:
1. Check Neon documentation: https://neon.tech/docs/
2. Contact Neon support through their dashboard
3. Or let me know and I can help guide you through the process

---

## Quick Commands Reference

```bash
# Restore images only (quick fix)
npx ts-node scripts/restore-correct-images-from-backup.ts

# Check database restoration options
npx ts-node scripts/restore-database-from-backup.ts

# Restore from backup file (if you have one)
npx ts-node scripts/restore-database-from-backup.ts path/to/backup.sql
```
