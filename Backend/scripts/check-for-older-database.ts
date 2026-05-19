import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function checkForOlderDatabase() {
  console.log('🔍 Checking for older database or backup options...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const dbUrl = process.env.DATABASE_URL || '';
  console.log('📊 Current Database Info:\n');
  console.log(`   Connection: ${dbUrl.substring(0, 50)}...\n`);
  
  // Extract project info from URL
  const urlMatch = dbUrl.match(/ep-([^-]+)-/);
  const projectId = urlMatch ? urlMatch[1] : 'unknown';
  
  console.log('🔍 What to Check:\n');
  console.log('1. Check Neon Console for OTHER Projects:');
  console.log('   - Go to: https://console.neon.tech/');
  console.log('   - Look for OTHER projects (not just "main" branch)');
  console.log('   - Check if you have an OLDER project that was created before March 16\n');
  
  console.log('2. Check for Backup Files:');
  const backupDirs = [
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../../..'),
    process.env.HOME || process.env.USERPROFILE || '',
  ];
  
  console.log('   Searching for backup files...\n');
  const backupExtensions = ['.sql', '.dump', '.backup', '.pg_dump'];
  let foundBackups = false;
  
  for (const dir of backupDirs) {
    if (!fs.existsSync(dir)) continue;
    
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        if (file.isFile()) {
          const ext = path.extname(file.name).toLowerCase();
          if (backupExtensions.includes(ext)) {
            const fullPath = path.join(dir, file.name);
            const stats = fs.statSync(fullPath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            const modified = stats.mtime.toISOString().split('T')[0];
            
            console.log(`   ✅ Found: ${file.name}`);
            console.log(`      Location: ${fullPath}`);
            console.log(`      Size: ${sizeMB} MB`);
            console.log(`      Modified: ${modified}\n`);
            foundBackups = true;
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  if (!foundBackups) {
    console.log('   ⚠️  No backup files found in common locations\n');
  }
  
  console.log('3. Check for Database Exports:');
  console.log('   - Look in your Downloads folder');
  console.log('   - Check your cloud storage (Google Drive, Dropbox, etc.)');
  console.log('   - Check if you exported data before\n');
  
  console.log('4. Check Previous Database Provider:');
  console.log('   - Did you migrate from Aiven or another provider?');
  console.log('   - Check if the old database still exists\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 Solutions:\n');
  console.log('   Option 1: Find an older Neon project');
  console.log('   Option 2: Restore from a backup file');
  console.log('   Option 3: Check if you have another database provider');
  console.log('   Option 4: Use the data we already fixed (images restored)\n');
  
  console.log('📝 Next Steps:\n');
  console.log('   1. Go to Neon Console: https://console.neon.tech/');
  console.log('   2. Check ALL projects (not just the current one)');
  console.log('   3. Look for projects created BEFORE March 16');
  console.log('   4. If found, use that project\'s connection string\n');
}

checkForOlderDatabase().catch(console.error);
