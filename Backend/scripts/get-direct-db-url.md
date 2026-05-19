# How to Get Your Direct Database Connection String

Since Prisma Accelerate has reached its plan limit, we need the **direct database connection string** from Aiven to migrate your data.

## Steps to Get Direct Database URL from Aiven:

1. **Log in to Aiven Console:**
   - Go to: https://console.aiven.io/
   - Sign in with your account

2. **Find Your PostgreSQL Service:**
   - Click on your PostgreSQL service (it should be named something like "pg-32be59aa...")

3. **Get Connection Information:**
   - Click on **"Connection Information"** or **"Service URIs"** tab
   - Look for **"Connection string"** or **"PostgreSQL URI"**
   - You'll see something like:
     ```
     postgresql://avnadmin:PASSWORD@HOST:PORT/DATABASE?sslmode=require
     ```

4. **Copy the Connection String:**
   - Copy the **full connection string**
   - It should look like:
     ```
     postgresql://avnadmin:AVNS_xxxxx@pg-xxxxx.h.aivencloud.com:23114/development?sslmode=require
     ```

5. **Use Connection Pooler (Recommended):**
   - If available, use the **connection pooler URL** instead
   - It will have `-pooler` in the hostname
   - Example:
     ```
     postgresql://avnadmin:PASSWORD@pg-xxxxx-pooler.aivencloud.com:PORT/DATABASE?sslmode=require
     ```

## Alternative: If Database is Not Accessible

If you can't access the Aiven database:
1. Check if the service is **running** (not paused/stopped)
2. Check if your **IP is whitelisted** in firewall settings
3. Verify the **service hasn't been deleted**

## Once You Have the Connection String:

1. Add it to your `.env` file:
   ```bash
   OLD_DATABASE_URL="your-direct-connection-string-here"
   ```

2. Or update `scripts/migrate-data.ts` directly

3. Run the migration:
   ```bash
   npx ts-node scripts/migrate-data.ts
   ```

## Need Help?

If you're having trouble finding the connection string, let me know and I can help you locate it in the Aiven dashboard!


