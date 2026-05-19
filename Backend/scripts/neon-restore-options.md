# Neon Database Restore - Solutions for 2 Days Ago

## The Problem
Neon's **Instant point-in-time restore** only works for the **past 6 hours**. You're trying to restore to 2 days ago, which is beyond this limit.

## Solutions

### Option 1: Create a Branch from Point in Time (Recommended)

Instead of using "Backup & Restore", try creating a **new branch**:

1. In Neon Console, go to **"Branches"** (left sidebar)
2. Click **"Create Branch"**
3. Select **"Create from point in time"**
4. Choose a date from 2 days ago
5. This creates a new branch with data from that time
6. Get the connection string from the new branch
7. Update your `.env` file with the new branch's connection string

**Note:** Branch creation from point in time may have longer retention (up to 7 days or more depending on your plan).

---

### Option 2: Use Snapshots

1. In the "Backup & Restore" page, click **"Create snapshot"**
2. This creates a snapshot of your current database
3. For future: Create snapshots regularly so you can restore from them
4. **Note:** You can't create a snapshot of the past, only of the current state

---

### Option 3: Check Your Plan's Retention Period

1. Go to Neon Console → **Settings** or **Billing**
2. Check your plan's **"History retention"** period
3. Free tier: Usually 6 hours
4. Paid plans: May have 7 days or more
5. If you need longer retention, consider upgrading

---

### Option 4: Manual Data Restoration

If you have exported data or backups from 2 days ago:

1. Export your current data (as backup)
2. Import the old data from your backup files
3. Use the restore scripts we created earlier

---

## Quick Fix for Your Current Situation

Since you can't use instant restore for 2 days ago, try:

1. **Check Branches tab** - See if you can create a branch from point in time there
2. **Contact Neon Support** - They might be able to help restore from longer retention
3. **Use the image restoration we just did** - At least your product images are fixed

---

## Prevention for Future

1. **Create regular snapshots** - Weekly or daily
2. **Upgrade your Neon plan** - For longer history retention
3. **Export backups regularly** - Keep SQL dumps of your database
4. **Use version control** - Track important data changes
