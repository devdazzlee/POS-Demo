import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
dotenv.config();

const prisma = new PrismaClient();

interface RestoreOptions {
  backupFile?: string;
  usePointInTime?: boolean;
  targetDate?: string; // Format: YYYY-MM-DD
}

async function checkDatabaseProvider(): Promise<string> {
  const dbUrl = process.env.DATABASE_URL || '';
  
  if (dbUrl.includes('aiven')) {
    return 'aiven';
  } else if (dbUrl.includes('neon')) {
    return 'neon';
  } else if (dbUrl.includes('supabase')) {
    return 'supabase';
  } else if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
    return 'local';
  }
  
  return 'unknown';
}

async function restoreFromBackup(backupFile: string) {
  console.log('🔄 Restoring database from backup file...\n');
  
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found: ${backupFile}`);
  }
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL not found in environment variables');
  }
  
  // Extract connection details from DATABASE_URL
  const url = new URL(dbUrl);
  const host = url.hostname;
  const port = url.port || '5432';
  const database = url.pathname.slice(1); // Remove leading /
  const user = url.username;
  const password = url.password;
  
  console.log(`📦 Restoring to database: ${database} on ${host}:${port}\n`);
  console.log('⚠️  WARNING: This will REPLACE all current data!\n');
  
  try {
    // Use pg_restore for .dump files or psql for .sql files
    const fileExt = path.extname(backupFile).toLowerCase();
    
    if (fileExt === '.dump' || fileExt === '.backup') {
      // Use pg_restore
      const restoreCmd = `PGPASSWORD="${password}" pg_restore -h ${host} -p ${port} -U ${user} -d ${database} --clean --if-exists --no-owner --no-privileges "${backupFile}"`;
      console.log('🔄 Running pg_restore...\n');
      const { stdout, stderr } = await execAsync(restoreCmd);
      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes('WARNING')) console.error(stderr);
    } else if (fileExt === '.sql') {
      // Use psql
      const restoreCmd = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d ${database} -f "${backupFile}"`;
      console.log('🔄 Running psql restore...\n');
      const { stdout, stderr } = await execAsync(restoreCmd);
      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes('WARNING')) console.error(stderr);
    } else {
      throw new Error(`Unsupported backup file format: ${fileExt}`);
    }
    
    console.log('\n✅ Database restored successfully!\n');
  } catch (error: any) {
    console.error('❌ Restore failed:', error.message);
    throw error;
  }
}

async function checkPointInTimeRecovery(provider: string) {
  console.log(`\n📋 Checking Point-in-Time Recovery options for ${provider}...\n`);
  
  switch (provider) {
    case 'aiven':
      console.log('ℹ️  Aiven PostgreSQL supports Point-in-Time Recovery:');
      console.log('   1. Go to: https://console.aiven.io/');
      console.log('   2. Select your PostgreSQL service');
      console.log('   3. Go to "Backups" or "Service settings"');
      console.log('   4. Look for "Point-in-time recovery" or "PITR" option');
      console.log('   5. Select a restore point from 2 days ago\n');
      break;
      
    case 'neon':
      console.log('ℹ️  Neon PostgreSQL supports Branching (time-travel):');
      console.log('   1. Go to: https://console.neon.tech/');
      console.log('   2. Select your project');
      console.log('   3. Create a new branch from a specific point in time');
      console.log('   4. Or use the Neon API to restore to a specific timestamp\n');
      break;
      
    case 'supabase':
      console.log('ℹ️  Supabase supports Point-in-Time Recovery:');
      console.log('   1. Go to: https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Go to "Database" → "Backups"');
      console.log('   4. Look for "Point-in-time recovery" option\n');
      break;
      
    default:
      console.log('ℹ️  For local PostgreSQL or other providers:');
      console.log('   - Check if you have WAL archiving enabled');
      console.log('   - Use pg_basebackup if available');
      console.log('   - Or restore from a backup file\n');
  }
}

async function main() {
  console.log('🔄 Database Restoration Tool\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const provider = await checkDatabaseProvider();
  console.log(`📊 Database Provider: ${provider}\n`);
  
  // Check for backup files
  const backupDir = path.resolve(__dirname, '..');
  const possibleBackups = [
    path.join(backupDir, 'backup.sql'),
    path.join(backupDir, 'backup.dump'),
    path.join(backupDir, 'database-backup.sql'),
    path.join(backupDir, 'database-backup.dump'),
  ];
  
  const foundBackups = possibleBackups.filter(f => fs.existsSync(f));
  
  if (foundBackups.length > 0) {
    console.log('✅ Found backup files:');
    foundBackups.forEach(f => console.log(`   - ${f}`));
    console.log('');
  } else {
    console.log('⚠️  No backup files found in the project directory\n');
  }
  
  // Check Point-in-Time Recovery options
  await checkPointInTimeRecovery(provider);
  
  console.log('📝 Restoration Options:\n');
  console.log('   1. Point-in-Time Recovery (Recommended if available)');
  console.log('      - Use your database provider\'s dashboard');
  console.log('      - Restore to a specific timestamp (2 days ago)\n');
  
  console.log('   2. Restore from Backup File');
  console.log('      - If you have a .sql or .dump file');
  console.log('      - Run: npx ts-node scripts/restore-database-from-backup.ts <backup-file>\n');
  
  console.log('   3. Manual SQL Restore');
  console.log('      - Export data from a backup database');
  console.log('      - Import into current database\n');
  
  // If backup file provided as argument, restore it
  const args = process.argv.slice(2);
  if (args.length > 0 && args[0]) {
    const backupFile = path.resolve(args[0]);
    try {
      await restoreFromBackup(backupFile);
    } catch (error) {
      console.error('❌ Restoration failed:', error);
      process.exit(1);
    }
  } else {
    console.log('💡 To restore from a backup file, run:');
    console.log('   npx ts-node scripts/restore-database-from-backup.ts <path-to-backup-file>\n');
  }
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
