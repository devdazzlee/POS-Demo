import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function autoExportWhenAivenReady() {
  console.log('🔄 Auto-Export from Aiven (Will Retry Until Connected)...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const backupEnvPath = path.resolve(__dirname, '../.env.backup');
  if (!fs.existsSync(backupEnvPath)) {
    console.error('❌ .env.backup file not found');
    process.exit(1);
  }
  
  const backupContent = fs.readFileSync(backupEnvPath, 'utf-8');
  const dbUrlMatch = backupContent.match(/DATABASE_URL=(.+)/);
  
  if (!dbUrlMatch) {
    console.error('❌ No DATABASE_URL found in .env.backup');
    process.exit(1);
  }
  
  const aivenDbUrl = dbUrlMatch[1].trim().replace(/^["']|["']$/g, '');
  
  console.log('📊 Aiven Database:');
  console.log(`   ${aivenDbUrl.substring(0, 60)}...\n`);
  console.log('🔄 Attempting connection (will retry if failed)...\n');
  
  let connected = false;
  let attempts = 0;
  const maxAttempts = 5;
  
  while (!connected && attempts < maxAttempts) {
    attempts++;
    console.log(`   Attempt ${attempts}/${maxAttempts}...`);
    
    try {
      const aivenPrisma = new PrismaClient({
        datasources: {
          db: { url: aivenDbUrl },
        },
      });
      
      await aivenPrisma.$connect();
      console.log('   ✅ CONNECTED!\n');
      connected = true;
      
      // Export data
      console.log('📦 Exporting data...\n');
      
      const products = await aivenPrisma.product.findMany({
        include: {
          category: true,
          ProductImage: true,
        },
      });
      
      const categories = await aivenPrisma.category.findMany({
        include: {
          CategoryImages: true,
        },
      });
      
      const backupDir = path.resolve(__dirname, '../database-backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportFile = path.join(backupDir, `aiven-export-${timestamp}.json`);
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        source: 'Aiven',
        summary: {
          products: products.length,
          categories: categories.length,
          productImages: products.reduce((sum, p) => sum + p.ProductImage.length, 0),
          categoryImages: categories.reduce((sum, c) => sum + c.CategoryImages.length, 0),
        },
        products: products,
        categories: categories,
      };
      
      fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ EXPORT SUCCESSFUL!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   📦 Products: ${products.length}`);
      console.log(`   📁 Categories: ${categories.length}`);
      console.log(`   📸 Product Images: ${exportData.summary.productImages}`);
      console.log(`   🖼️  Category Images: ${exportData.summary.categoryImages}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(`💾 Exported to: ${exportFile}\n`);
      
      await aivenPrisma.$disconnect();
      
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}\n`);
      
      if (attempts < maxAttempts) {
        console.log(`   ⏳ Waiting 10 seconds before retry...\n`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      } else {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('❌ Could not connect after 5 attempts\n');
        console.log('📝 TO FIX THIS:\n');
        console.log('   1. Go to: https://console.aiven.io/');
        console.log('   2. Log in with your account');
        console.log('   3. Find PostgreSQL service: pg-32be59aa...');
        console.log('   4. Click "Start" or "Resume" if it\'s paused');
        console.log('   5. Wait 1-2 minutes for it to start');
        console.log('   6. Run this script again:');
        console.log('      npx ts-node scripts/try-export-from-aiven.ts\n');
      }
    }
  }
}

autoExportWhenAivenReady().catch(console.error);
