# Data Migration Guide

This guide will help you migrate your data from the old Aiven database to the new Neon database.

## Prerequisites

1. Access to your old database (Aiven dashboard or connection string)
2. New Neon database is set up and migrations are applied
3. Node.js and dependencies installed

## Step 1: Get Your Old Database Connection String

### Option A: From Aiven Dashboard
1. Go to https://console.aiven.io/
2. Select your PostgreSQL service
3. Go to "Connection Information" or "Service URIs"
4. Copy the connection string (preferably the connection pooler URL)

### Option B: Use Prisma Accelerate (if still working)
If your Prisma Accelerate is still accessible, you can use that connection string.

## Step 2: Update the Migration Script

Edit the `.env` file in the Backend directory and add:

```bash
OLD_DATABASE_URL="your-old-database-connection-string-here"
```

Or update the `OLD_DB_URL` constant in `scripts/migrate-data.ts` directly.

## Step 3: Run the Migration

```bash
cd Backend
npx ts-node scripts/migrate-data.ts
```

The script will:
- Connect to both old and new databases
- Migrate all tables in the correct order (respecting foreign keys)
- Show progress for each table
- Handle errors gracefully (continues even if one table fails)

## Step 4: Verify the Migration

After migration completes, check your new database:
- Count records in key tables
- Verify relationships are intact
- Test your application

## Troubleshooting

### "Can't reach database server"
- Verify the old database is still running
- Check the connection string is correct
- Ensure your IP is whitelisted (if required)
- Try using the connection pooler URL instead of direct connection

### "Foreign key constraint failed"
- The script migrates tables in dependency order, but if you see this:
  - Check if all parent records exist
  - You may need to run the migration again (it uses upsert, so safe to re-run)

### "Connection timeout"
- The old database might be slow or unreachable
- Try using Prisma Accelerate URL if available
- Check network connectivity

## Alternative: Manual Export/Import

If the migration script doesn't work, you can:

1. **Export from old database:**
   ```bash
   pg_dump "your-old-connection-string" > backup.sql
   ```

2. **Import to new database:**
   ```bash
   psql "your-new-connection-string" < backup.sql
   ```

## Need Help?

If you encounter issues:
1. Check the error message carefully
2. Verify both database connections work independently
3. Ensure all migrations are applied to the new database first


