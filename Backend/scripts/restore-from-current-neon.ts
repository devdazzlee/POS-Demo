import { prisma } from '../src/prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function restoreFromCurrentNeon() {
  console.log('🔄 Restoring from Current Neon Database\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const dbUrl = process.env.DATABASE_URL;
  console.log('📊 Current Database:');
  console.log(`   ${dbUrl?.substring(0, 80)}...\n`);
  
  console.log('⚠️  Important Limitations:');
  console.log('   - Database created: March 16, 2026 at 8:42 PM');
  console.log('   - History retention: 6 hours');
  console.log('   - Can only restore to times AFTER 8:42 PM on March 16\n');
  
  console.log('💡 What We Can Do:\n');
  
  console.log('Option 1: Restore to Earliest Available Point');
  console.log('   - Restore to right after database creation (8:42 PM March 16)');
  console.log('   - This is the oldest data available in this database\n');
  
  console.log('Option 2: Export Current Data');
  console.log('   - Export all current data as backup');
  console.log('   - Save it for future use\n');
  
  console.log('Option 3: Check for Snapshots');
  console.log('   - Check if Neon has any snapshots');
  console.log('   - Restore from snapshot if available\n');
  
  // Check current state
  console.log('📦 Current Database State:\n');
  
  try {
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    const imageCount = await prisma.productImage.count();
    
    console.log(`   Products: ${productCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Product Images: ${imageCount}\n`);
    
    // Get some sample data to see what we have
    const recentProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 5,
    });
    
    console.log('📋 Sample Products (most recent):');
    recentProducts.forEach((p, i) => {
      const created = new Date(p.created_at).toISOString().split('T')[0];
      const updated = new Date(p.updated_at).toISOString().split('T')[0];
      console.log(`   ${i + 1}. ${p.name} (created: ${created}, updated: ${updated})`);
    });
    console.log('');
    
    // Check what we can restore
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔄 Restoration Options:\n');
    
    console.log('1. Restore to Earliest Point (8:42 PM March 16):');
    console.log('   - Go to Neon Console → Branches');
    console.log('   - Create branch from point in time');
    console.log('   - Select: March 16, 2026 at 8:42:56 PM (or slightly after)');
    console.log('   - This will restore to the moment right after database creation\n');
    
    console.log('2. Export Current Data:');
    console.log('   - I can create a script to export all data');
    console.log('   - Save it as SQL dump for backup\n');
    
    console.log('3. Manual Fix Based on What Changed:');
    console.log('   - We already fixed product images (176 products)');
    console.log('   - Tell me what else changed, I can help fix it\n');
    
    // Create export script
    console.log('💾 Creating data export script...\n');
    
    const exportScript = `import { prisma } from '../src/prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function exportDatabase() {
  console.log('📤 Exporting database...\\n');
  
  const exportData: any = {
    exportedAt: new Date().toISOString(),
    products: await prisma.product.findMany(),
    categories: await prisma.category.findMany(),
    productImages: await prisma.productImage.findMany(),
  };
  
  const exportPath = path.resolve(__dirname, '../database-export-' + Date.now() + '.json');
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
  
  console.log('✅ Exported to:', exportPath);
  await prisma.$disconnect();
}

exportDatabase().catch(console.error);
`;
    
    fs.writeFileSync(
      path.resolve(__dirname, '../scripts/export-current-database.ts'),
      exportScript
    );
    
    console.log('✅ Created: scripts/export-current-database.ts\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 Next Steps:\n');
    console.log('   To restore to earliest point:');
    console.log('   1. Go to: https://console.neon.tech/');
    console.log('   2. Select your project: neon-orange-elephant');
    console.log('   3. Go to "Branches" → "Create Branch"');
    console.log('   4. Select "Past data"');
    console.log('   5. Choose: March 16, 2026 at 8:42:56 PM (or 8:43 PM)');
    console.log('   6. Create the branch');
    console.log('   7. Use that branch\'s connection string\n');
    
    console.log('   To export current data:');
    console.log('   Run: npx ts-node scripts/export-current-database.ts\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

restoreFromCurrentNeon().catch(console.error);
