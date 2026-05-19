import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function tryExportFromAiven() {
  console.log('🔄 Attempting to Connect to Aiven Database...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Get Aiven connection string from .env.backup
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
  
  console.log('📊 Aiven Database Connection:');
  console.log(`   ${aivenDbUrl.substring(0, 80)}...\n`);
  
  console.log('🔄 Attempting to connect...\n');
  
  try {
    // Create Prisma client with Aiven connection
    const aivenPrisma = new PrismaClient({
      datasources: {
        db: {
          url: aivenDbUrl,
        },
      },
    });
    
    // Try to connect
    await aivenPrisma.$connect();
    console.log('✅ SUCCESS! Connected to Aiven database!\n');
    
    // Check what data is available
    console.log('📦 Checking available data...\n');
    
    const productCount = await aivenPrisma.product.count();
    const categoryCount = await aivenPrisma.category.count();
    const imageCount = await aivenPrisma.productImage.count();
    
    console.log(`   Products: ${productCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Product Images: ${imageCount}\n`);
    
    if (productCount === 0 && categoryCount === 0) {
      console.log('⚠️  Database is empty. No data to export.\n');
      await aivenPrisma.$disconnect();
      return;
    }
    
    // Export all data
    console.log('💾 Exporting all data from Aiven...\n');
    
    const products = await aivenPrisma.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            code: true,
          },
        },
        ProductImage: {
          select: {
            id: true,
            image: true,
            status: true,
            is_active: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    const categories = await aivenPrisma.category.findMany({
      include: {
        CategoryImages: {
          select: {
            id: true,
            image: true,
            status: true,
            is_active: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    // Save to backup file
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
    console.log('✅ EXPORT COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   📦 Products: ${products.length}`);
    console.log(`   📁 Categories: ${categories.length}`);
    console.log(`   📸 Product Images: ${exportData.summary.productImages}`);
    console.log(`   🖼️  Category Images: ${exportData.summary.categoryImages}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`💾 Data exported to: ${exportFile}\n`);
    console.log('📝 Next Step: I can restore this data to your Neon database!\n');
    
    await aivenPrisma.$disconnect();
    
  } catch (error: any) {
    console.log('❌ Could not connect to Aiven database\n');
    console.log(`   Error: ${error.message}\n`);
    
    if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.log('💡 The database is likely:');
      console.log('   - Paused/stopped (most common)');
      console.log('   - Not accessible from your IP');
      console.log('   - Deleted or moved\n');
      console.log('📝 To fix this:');
      console.log('   1. Go to: https://console.aiven.io/');
      console.log('   2. Find your PostgreSQL service');
      console.log('   3. Click "Start" or "Resume" if it\'s paused');
      console.log('   4. Wait 1-2 minutes for it to start');
      console.log('   5. Run this script again\n');
    } else {
      console.log('💡 Try checking:');
      console.log('   - Aiven console: https://console.aiven.io/');
      console.log('   - Service status');
      console.log('   - Connection string is correct\n');
    }
  }
}

tryExportFromAiven().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
