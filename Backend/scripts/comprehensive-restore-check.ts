import { prisma } from '../src/prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
dotenv.config();

async function comprehensiveRestoreCheck() {
  console.log('🔍 COMPREHENSIVE RESTORATION OPTIONS CHECK\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const options: string[] = [];
  
  // Option 1: Check for SQL backup files
  console.log('1️⃣  Checking for SQL/Dump backup files...\n');
  const backupExtensions = ['.sql', '.dump', '.backup', '.pg_dump', '.tar'];
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
        const fullPath = path.join(searchPath, file.toString());
        try {
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
          // Skip files we can't access
        }
      }
    } catch (e) {
      // Skip directories we can't read
    }
  }
  
  if (foundBackups.length > 0) {
    options.push(`Found ${foundBackups.length} backup file(s) - Can restore from these!`);
  } else {
    console.log('   ❌ No backup files found\n');
  }
  
  // Option 2: Check git history for database dumps
  console.log('\n2️⃣  Checking git history for database exports...\n');
  try {
    const { stdout } = await execAsync('cd ' + path.resolve(__dirname, '..') + ' && git log --all --full-history --oneline -- "*backup*" "*dump*" "*export*" "*database*" 2>/dev/null | head -10');
    if (stdout.trim()) {
      console.log('   ✅ Found potential database files in git history:');
      console.log(stdout);
      options.push('Git history contains database-related files - May have old versions');
    } else {
      console.log('   ❌ No database files in git history\n');
    }
  } catch (e) {
    console.log('   ⚠️  Could not check git history\n');
  }
  
  // Option 3: Check for environment variable backups with old connection strings
  console.log('\n3️⃣  Checking for old database connection strings...\n');
  const envFiles = [
    path.resolve(__dirname, '../.env.backup'),
    path.resolve(__dirname, '../.env.old'),
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../.env.production'),
  ];
  
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf-8');
      const dbUrlMatch = content.match(/DATABASE_URL=(.+)/);
      if (dbUrlMatch) {
        const oldUrl = dbUrlMatch[1];
        if (oldUrl !== process.env.DATABASE_URL) {
          console.log(`   ✅ Found different DATABASE_URL in ${path.basename(envFile)}`);
          console.log(`      ${oldUrl.substring(0, 60)}...`);
          options.push('Found old database connection - May point to older database');
        }
      }
    }
  }
  
  // Option 4: Check for Prisma migration files that might have data
  console.log('\n4️⃣  Checking Prisma migrations for data snapshots...\n');
  const migrationsDir = path.resolve(__dirname, '../src/prisma/migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir);
    const recentMigrations = migrations
      .filter(m => fs.statSync(path.join(migrationsDir, m)).isDirectory())
      .sort()
      .reverse()
      .slice(0, 5);
    
    console.log(`   Found ${migrations.length} migrations`);
    console.log(`   Recent migrations: ${recentMigrations.join(', ')}\n`);
    options.push('Prisma migrations exist - May contain schema/data history');
  }
  
  // Option 5: Check current database for what we can export
  console.log('\n5️⃣  Current database state analysis...\n');
  try {
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    const imageCount = await prisma.productImage.count();
    
    console.log(`   Products: ${productCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Product Images: ${imageCount}\n`);
    
    // Check if we can identify what changed
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
      take: 10,
    });
    
    const recentUpdates = products.filter(p => {
      const updated = new Date(p.updated_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return updated >= today;
    });
    
    if (recentUpdates.length > 0) {
      console.log(`   ⚠️  ${recentUpdates.length} products updated today`);
      options.push('Can identify recently updated records - May help restore');
    }
  } catch (e) {
    console.log('   ⚠️  Could not analyze database\n');
  }
  
  // Option 6: Check for seed files that might have original data
  console.log('\n6️⃣  Checking for seed files with original data...\n');
  const seedFiles = [
    path.resolve(__dirname, '../seeders'),
    path.resolve(__dirname, '../seeder_with_images'),
    path.resolve(__dirname, '../image-seeder'),
  ];
  
  for (const seedDir of seedFiles) {
    if (fs.existsSync(seedDir)) {
      const files = fs.readdirSync(seedDir);
      const jsonFiles = files.filter(f => f.toString().endsWith('.json'));
      if (jsonFiles.length > 0) {
        console.log(`   ✅ Found seed files in ${path.basename(seedDir)}:`);
        jsonFiles.forEach(f => console.log(`      - ${f}`));
        options.push('Seed files found - May contain original product data');
      }
    }
  }
  
  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY OF POSSIBLE RESTORATION OPTIONS:\n');
  
  if (options.length === 0) {
    console.log('❌ No automatic restoration options found\n');
    console.log('💡 Manual Options:');
    console.log('   1. Tell me what data changed, I can help fix it manually');
    console.log('   2. Export current data, compare with what you remember');
    console.log('   3. Re-enter data manually based on your records\n');
  } else {
    options.forEach((opt, i) => {
      console.log(`   ${i + 1}. ${opt}`);
    });
    console.log('');
  }
  
  // Create restoration script if backups found
  if (foundBackups.length > 0) {
    console.log('💾 Creating restoration script for backup files...\n');
    const restoreScript = `import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

const backupFiles = ${JSON.stringify(foundBackups, null, 2)};

console.log('Found backup files:');
backupFiles.forEach((f, i) => console.log(\`\${i+1}. \${f}\`));
console.log('\\nTo restore, run: npx ts-node scripts/restore-database-from-backup.ts <backup-file-path>');
`;
    
    fs.writeFileSync(
      path.resolve(__dirname, '../scripts/list-found-backups.ts'),
      restoreScript
    );
    console.log('✅ Created: scripts/list-found-backups.ts\n');
  }
  
  await prisma.$disconnect();
}

comprehensiveRestoreCheck().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
