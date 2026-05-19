import { prisma } from '../src/prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
dotenv.config();

async function findOldDataOptions() {
  console.log('🔍 Searching for Data from 1-2 Days Ago...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const options: Array<{ option: string; description: string; action: string; available: boolean }> = [];
  
  // Option 1: Check Aiven Database
  console.log('1️⃣  Checking Aiven Database (Old Database)...\n');
  const backupEnvPath = path.resolve(__dirname, '../.env.backup');
  if (fs.existsSync(backupEnvPath)) {
    const backupContent = fs.readFileSync(backupEnvPath, 'utf-8');
    const dbUrlMatch = backupContent.match(/DATABASE_URL=(.+)/);
    
    if (dbUrlMatch) {
      const oldDbUrl = dbUrlMatch[1].trim().replace(/^["']|["']$/g, '');
      
      if (oldDbUrl.includes('aiven') || oldDbUrl.includes('pg-32be59aa')) {
        console.log('   ✅ Found Aiven database connection\n');
        console.log('   📝 Action: Check Aiven Console to start the database\n');
        console.log('   Steps:');
        console.log('   1. Go to: https://console.aiven.io/');
        console.log('   2. Find service: pg-32be59aa...');
        console.log('   3. Start it if paused');
        console.log('   4. Get connection string');
        console.log('   5. We can restore data from there\n');
        
        options.push({
          option: 'Aiven Database',
          description: 'Old Aiven database that may have data from 2 days ago',
          action: 'Start Aiven service and restore from it',
          available: false, // Need to check if accessible
        });
      }
    }
  }
  
  // Option 2: Check for SQL backup files
  console.log('\n2️⃣  Checking for SQL/Dump Backup Files...\n');
  const backupExtensions = ['.sql', '.dump', '.backup', '.pg_dump'];
  const searchPaths = [
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../../..'),
    path.join(process.env.HOME || '', 'Downloads'),
    path.join(process.env.HOME || '', 'Desktop'),
    path.join(process.env.HOME || '', 'Documents'),
  ];
  
  let foundBackups: string[] = [];
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
            if (backupExtensions.includes(ext)) {
              const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
              const modified = stats.mtime.toISOString().split('T')[0];
              foundBackups.push(fullPath);
              console.log(`   ✅ Found: ${file} (${sizeMB} MB, modified: ${modified})`);
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
  
  if (foundBackups.length > 0) {
    options.push({
      option: 'Backup Files',
      description: `Found ${foundBackups.length} backup file(s)`,
      action: 'Restore from backup file',
      available: true,
    });
  } else {
    console.log('   ❌ No backup files found\n');
  }
  
  // Option 3: Check git history for database exports
  console.log('\n3️⃣  Checking Git History for Database Exports...\n');
  try {
    const { stdout } = await execAsync('cd ' + path.resolve(__dirname, '..') + ' && git log --all --full-history --oneline --name-only -- "*backup*" "*dump*" "*export*" "*database*" "*sql*" 2>/dev/null | head -20');
    if (stdout.trim()) {
      console.log('   ✅ Found potential database files in git history\n');
      console.log('   Recent commits with database-related files:');
      console.log(stdout);
      options.push({
        option: 'Git History',
        description: 'Database files found in git history',
        action: 'Checkout old version from git',
        available: true,
      });
    } else {
      console.log('   ❌ No database files in git history\n');
    }
  } catch (e) {
    console.log('   ⚠️  Could not check git history\n');
  }
  
  // Option 4: Use Seed Files (recreate from original data)
  console.log('\n4️⃣  Checking Seed Files (Original Product Data)...\n');
  const seedFiles = [
    path.resolve(__dirname, '../seeder_with_images/dates-products.json'),
    path.resolve(__dirname, '../seeder_with_images/dried-fruits-nuts-products.json'),
    path.resolve(__dirname, '../seeder_with_images/grains_pulses_rice.json'),
    path.resolve(__dirname, '../image-seeder/spices_products.json'),
  ];
  
  let seedFilesFound = 0;
  for (const seedFile of seedFiles) {
    if (fs.existsSync(seedFile)) {
      const stats = fs.statSync(seedFile);
      const data = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
      const productCount = Array.isArray(data) ? data.length : 0;
      console.log(`   ✅ ${path.basename(seedFile)}: ${productCount} products`);
      seedFilesFound++;
    }
  }
  
  if (seedFilesFound > 0) {
    console.log(`\n   💡 We can recreate products from these seed files!\n`);
    options.push({
      option: 'Seed Files',
      description: `Found ${seedFilesFound} seed files with original product data`,
      action: 'Recreate products from seed files',
      available: true,
    });
  } else {
    console.log('   ❌ No seed files found\n');
  }
  
  // Option 5: Check Neon for earliest restore point
  console.log('\n5️⃣  Checking Neon Database Options...\n');
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.includes('neon')) {
    console.log('   ⚠️  Neon database created: March 16, 2026 at 8:42 PM');
    console.log('   ⚠️  Can only restore to times AFTER creation');
    console.log('   ❌ Cannot restore to 1-2 days before (database didn\'t exist)\n');
    
    options.push({
      option: 'Neon Time-Travel',
      description: 'Neon database - earliest point is March 16, 8:42 PM',
      action: 'Restore to earliest available point (not 2 days ago)',
      available: false,
    });
  }
  
  // Option 6: Check for exported data files
  console.log('\n6️⃣  Checking for Exported Data Files...\n');
  const exportFiles = [
    path.resolve(__dirname, '../database-export-*.json'),
    path.resolve(__dirname, '../products-export-*.json'),
    path.resolve(__dirname, '../data-export-*.json'),
  ];
  
  // Check for any JSON export files
  const backendDir = path.resolve(__dirname, '..');
  if (fs.existsSync(backendDir)) {
    const files = fs.readdirSync(backendDir);
    const jsonExports = files.filter(f => 
      f.includes('export') || f.includes('backup') || f.includes('dump')
    ).filter(f => f.endsWith('.json'));
    
    if (jsonExports.length > 0) {
      console.log('   ✅ Found export files:');
      jsonExports.forEach(f => {
        const filePath = path.join(backendDir, f);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`      - ${f} (${sizeKB} KB)`);
      });
      console.log('');
      
      options.push({
        option: 'JSON Exports',
        description: `Found ${jsonExports.length} JSON export file(s)`,
        action: 'Restore from JSON export',
        available: true,
      });
    } else {
      console.log('   ❌ No export files found\n');
    }
  }
  
  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 AVAILABLE OPTIONS TO RESTORE DATA:\n');
  
  const availableOptions = options.filter(o => o.available);
  const unavailableOptions = options.filter(o => !o.available);
  
  if (availableOptions.length > 0) {
    console.log('✅ Available Options:\n');
    availableOptions.forEach((opt, i) => {
      console.log(`   ${i + 1}. ${opt.option}`);
      console.log(`      ${opt.description}`);
      console.log(`      Action: ${opt.action}\n`);
    });
  }
  
  if (unavailableOptions.length > 0) {
    console.log('⚠️  Options That Need Setup:\n');
    unavailableOptions.forEach((opt, i) => {
      console.log(`   ${i + 1}. ${opt.option}`);
      console.log(`      ${opt.description}`);
      console.log(`      Action: ${opt.action}\n`);
    });
  }
  
  if (options.length === 0) {
    console.log('❌ No restoration options found\n');
    console.log('💡 Best Option: Recreate from seed files');
    console.log('   We have seed files with original product data');
    console.log('   We can recreate all products and categories\n');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  await prisma.$disconnect();
}

findOldDataOptions().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
