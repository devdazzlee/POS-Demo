import { prisma } from '../src/prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
dotenv.config();

async function backupAndFind2DaysAgoData() {
  console.log('🔍 COMPREHENSIVE DATABASE BACKUP & RESTORE SEARCH\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const dbUrl = process.env.DATABASE_URL || '';
  console.log('📊 Current Database:', dbUrl.substring(0, 60) + '...\n');
  
  // Step 1: Create backup of current database NOW
  console.log('💾 Step 1: Creating Backup of Current Database...\n');
  
  const backupDir = path.resolve(__dirname, '../database-backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
  
  try {
    console.log('   Exporting current database data...\n');
    
    const products = await prisma.product.findMany({
      include: {
        category: true,
        ProductImage: true,
      },
    });
    
    const categories = await prisma.category.findMany({
      include: {
        CategoryImages: true,
      },
    });
    
    const backupData = {
      exportedAt: new Date().toISOString(),
      database: 'neon',
      products: products,
      categories: categories,
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`   ✅ Current backup saved: ${backupFile}\n`);
  } catch (error) {
    console.error(`   ❌ Backup failed: ${(error as Error).message}\n`);
  }
  
  // Step 2: Try SQL dump
  console.log('💾 Step 2: Creating SQL Dump...\n');
  
  try {
    const sqlDumpFile = path.join(backupDir, `dump-${timestamp}.sql`);
    
    // Extract connection details
    const url = new URL(dbUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1);
    const user = url.username;
    const password = url.password;
    
    console.log(`   Attempting SQL dump to: ${sqlDumpFile}\n`);
    
    // Try pg_dump
    try {
      const dumpCmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F p > "${sqlDumpFile}" 2>&1`;
      await execAsync(dumpCmd);
      
      if (fs.existsSync(sqlDumpFile) && fs.statSync(sqlDumpFile).size > 0) {
        console.log(`   ✅ SQL dump created: ${sqlDumpFile}\n`);
      } else {
        console.log(`   ⚠️  SQL dump may have failed (file empty or not created)\n`);
      }
    } catch (dumpError: any) {
      console.log(`   ⚠️  pg_dump not available or failed: ${dumpError.message}\n`);
    }
  } catch (error) {
    console.log(`   ⚠️  Could not create SQL dump\n`);
  }
  
  // Step 3: Check for old backups
  console.log('🔍 Step 3: Searching for Old Backups (2+ days ago)...\n');
  
  const searchPaths = [
    backupDir,
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../../..'),
    path.join(process.env.HOME || '', 'Downloads'),
    path.join(process.env.HOME || '', 'Desktop'),
    path.join(process.env.HOME || '', 'Documents'),
  ];
  
  const backupExtensions = ['.sql', '.dump', '.backup', '.json', '.pg_dump'];
  const oldBackups: Array<{ path: string; date: Date; size: number }> = [];
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  for (const searchPath of searchPaths) {
    if (!fs.existsSync(searchPath)) continue;
    
    try {
      const files = fs.readdirSync(searchPath, { recursive: false });
      for (const file of files) {
        try {
          const fullPath = path.join(searchPath, file.toString());
          const stats = fs.statSync(fullPath);
          
          if (stats.isFile()) {
            const ext = path.extname(file.toString()).toLowerCase();
            if (backupExtensions.includes(ext) || file.includes('backup') || file.includes('dump') || file.includes('export')) {
              const fileDate = stats.mtime;
              
              // Check if file is from 2+ days ago
              if (fileDate < twoDaysAgo) {
                oldBackups.push({
                  path: fullPath,
                  date: fileDate,
                  size: stats.size,
                });
              }
            }
          }
        } catch (e) {
          // Skip
        }
      }
    } catch (e) {
      // Skip
    }
  }
  
  // Sort by date (oldest first)
  oldBackups.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  if (oldBackups.length > 0) {
    console.log(`   ✅ Found ${oldBackups.length} old backup(s):\n`);
    oldBackups.forEach((backup, i) => {
      const sizeMB = (backup.size / (1024 * 1024)).toFixed(2);
      const dateStr = backup.date.toISOString().split('T')[0];
      console.log(`      ${i + 1}. ${path.basename(backup.path)}`);
      console.log(`         Date: ${dateStr}, Size: ${sizeMB} MB`);
      console.log(`         Path: ${backup.path}\n`);
    });
  } else {
    console.log('   ❌ No old backups found (2+ days ago)\n');
  }
  
  // Step 4: Check Aiven database
  console.log('🔍 Step 4: Checking Aiven Database (Old Database)...\n');
  
  const backupEnvPath = path.resolve(__dirname, '../.env.backup');
  if (fs.existsSync(backupEnvPath)) {
    const backupContent = fs.readFileSync(backupEnvPath, 'utf-8');
    const dbUrlMatch = backupContent.match(/DATABASE_URL=(.+)/);
    
    if (dbUrlMatch) {
      const oldDbUrl = dbUrlMatch[1].trim().replace(/^["']|["']$/g, '');
      
      if (oldDbUrl.includes('aiven')) {
        console.log('   ✅ Found Aiven database connection\n');
        console.log('   📝 CRITICAL: This is your best chance for 2-day-old data!\n');
        console.log('   Steps to restore from Aiven:');
        console.log('   1. Go to: https://console.aiven.io/');
        console.log('   2. Find service: pg-32be59aa...');
        console.log('   3. START the service if it\'s paused');
        console.log('   4. Get the connection string');
        console.log('   5. I can export all data from there\n');
        
        // Try to connect
        try {
          const { PrismaClient } = await import('@prisma/client');
          const aivenPrisma = new PrismaClient({
            datasources: {
              db: { url: oldDbUrl },
            },
          });
          
          await aivenPrisma.$connect();
          console.log('   ✅ Aiven database is ACCESSIBLE!\n');
          
          // Export data
          const aivenProducts = await aivenPrisma.product.findMany({
            include: {
              category: true,
              ProductImage: true,
            },
          });
          
          const aivenCategories = await aivenPrisma.category.findMany({
            include: {
              CategoryImages: true,
            },
          });
          
          const aivenBackupFile = path.join(backupDir, `aiven-backup-${timestamp}.json`);
          const aivenData = {
            exportedAt: new Date().toISOString(),
            database: 'aiven',
            products: aivenProducts,
            categories: aivenCategories,
          };
          
          fs.writeFileSync(aivenBackupFile, JSON.stringify(aivenData, null, 2));
          
          console.log(`   ✅ Aiven data exported: ${aivenBackupFile}`);
          console.log(`   📦 Products: ${aivenProducts.length}`);
          console.log(`   📁 Categories: ${aivenCategories.length}\n`);
          
          await aivenPrisma.$disconnect();
        } catch (error: any) {
          console.log(`   ❌ Aiven database not accessible: ${error.message}\n`);
          console.log('   💡 You need to START the Aiven service first!\n');
        }
      }
    }
  }
  
  // Step 5: Check Neon for earliest restore point
  console.log('🔍 Step 5: Checking Neon Restore Options...\n');
  
  if (dbUrl.includes('neon')) {
    console.log('   ⚠️  Neon database created: March 16, 2026 at 8:42 PM');
    console.log('   ❌ Cannot restore to 2 days before (database didn\'t exist)\n');
    console.log('   💡 Best option: Restore to earliest point (8:42 PM March 16)\n');
  }
  
  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY - HOW TO GET 2-DAY-OLD DATA:\n');
  
  if (oldBackups.length > 0) {
    console.log('✅ OPTION 1: Restore from Old Backup Files');
    console.log(`   Found ${oldBackups.length} backup file(s) from 2+ days ago`);
    console.log('   I can restore from these files\n');
  }
  
  console.log('✅ OPTION 2: Aiven Database (BEST OPTION)');
  console.log('   1. Go to: https://console.aiven.io/');
  console.log('   2. Start the PostgreSQL service');
  console.log('   3. Get connection string');
  console.log('   4. I will export all data from there\n');
  
  console.log('✅ OPTION 3: Recreate from Seed Files');
  console.log('   Use seed files to recreate products');
  console.log('   Then manually match images\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  await prisma.$disconnect();
}

backupAndFind2DaysAgoData().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
