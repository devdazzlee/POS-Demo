# Database Migration Steps - Complete Guide

## Current Situation

✅ **Migration script is ready** (`scripts/migrate-data.ts`)  
❌ **Old database is not reachable** - needs to be activated/accessed  
✅ **New database is ready** (Neon)  

## Why the Old Database Isn't Reachable

The Aiven database connection is failing. This usually means:

1. **Service is Paused** (Most Common)
   - Aiven pauses inactive services to save costs
   - You need to restart it in the Aiven dashboard

2. **Need Connection Pooler URL**
   - Direct connection might not work
   - Need to use the pooler URL instead

3. **Service Deleted**
   - Less likely, but possible if service was terminated

## Step-by-Step Solution

### Step 1: Check Aiven Dashboard

1. Go to: **https://console.aiven.io/**
2. Log in with your account
3. Find your PostgreSQL service (should be named something like `pg-32be59aa...`)

### Step 2: Check Service Status

- **If service shows "Paused" or "Stopped":**
  - Click on the service
  - Click **"Start"** or **"Resume"** button
  - Wait for it to start (usually 1-2 minutes)

- **If service shows "Running":**
  - Proceed to get connection string

### Step 3: Get Connection String

1. In your PostgreSQL service, click **"Connection Information"** or **"Service URIs"**
2. Look for **"Connection string"** or **"PostgreSQL URI"**
3. **IMPORTANT:** Try to get the **Connection Pooler URL** (recommended)
   - It will have `-pooler` in the hostname
   - Example: `postgresql://user:pass@pg-xxxxx-pooler.aivencloud.com:port/db?sslmode=require`

### Step 4: Update Migration Script

**Option A: Add to .env file** (Recommended)
```bash
OLD_DATABASE_URL="your-connection-string-from-aiven"
```

**Option B: Edit migrate-data.ts directly**
Update the `OLD_DB_URL` constant with your connection string.

### Step 5: Test Connection

Run the test script:
```bash
cd Backend
./scripts/check-and-migrate.sh
```

Or test manually:
```bash
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient({ datasources: { db: { url: 'YOUR_CONNECTION_STRING' } } });
db.\$connect().then(async () => {
  const count = await db.user.count();
  console.log('✅ Connected! Users found:', count);
  await db.\$disconnect();
});
"
```

### Step 6: Run Migration

Once connection works:
```bash
cd Backend
npx ts-node scripts/migrate-data.ts
```

## Alternative: If You Can't Access Aiven

If you can't access the Aiven dashboard or the service is deleted:

1. **Check if you have a database backup:**
   - Look for `.sql` dump files
   - Check if you exported data before

2. **Contact Aiven Support:**
   - They can help restore or access your service
   - Support: https://help.aiven.io/

3. **Use Prisma Accelerate (if plan allows):**
   - If you can upgrade Prisma Accelerate plan temporarily
   - Use that to export data, then cancel

## What the Migration Script Does

The script (`migrate-data.ts`) will:
- ✅ Connect to both databases
- ✅ Migrate all 33+ tables in correct order
- ✅ Handle foreign key relationships
- ✅ Show progress for each table
- ✅ Use `upsert` (safe to run multiple times)
- ✅ Continue even if one table fails

## Expected Migration Time

- Small database (< 1000 records): 1-2 minutes
- Medium database (1000-10000 records): 2-5 minutes  
- Large database (> 10000 records): 5-15 minutes

## After Migration

1. **Verify data:**
   ```bash
   # Check record counts
   npx ts-node -e "
   import { PrismaClient } from '@prisma/client';
   const db = new PrismaClient();
   Promise.all([
     db.user.count(),
     db.product.count(),
     db.sale.count()
   ]).then(([users, products, sales]) => {
     console.log('Users:', users);
     console.log('Products:', products);
     console.log('Sales:', sales);
   });
   "
   ```

2. **Test your application:**
   - Start the backend server
   - Try logging in
   - Check if data appears correctly

## Need Help?

If you're stuck:
1. Share the error message you're seeing
2. Check Aiven dashboard status
3. Verify the connection string format

---

**Next Step:** Go to Aiven dashboard and check your PostgreSQL service status!


