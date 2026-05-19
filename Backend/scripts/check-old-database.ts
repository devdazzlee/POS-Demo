import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function checkOldDatabase() {
  console.log('🔍 Checking Old Database Connection...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const backupEnvPath = path.resolve(__dirname, '../.env.backup');
  
  if (!fs.existsSync(backupEnvPath)) {
    console.log('❌ .env.backup file not found\n');
    return;
  }
  
  const backupContent = fs.readFileSync(backupEnvPath, 'utf-8');
  const dbUrlMatch = backupContent.match(/DATABASE_URL=(.+)/);
  
  if (!dbUrlMatch) {
    console.log('❌ No DATABASE_URL found in .env.backup\n');
    return;
  }
  
  const oldDbUrl = dbUrlMatch[1].trim().replace(/^["']|["']$/g, '');
  
  console.log('📊 Old Database Connection Found:\n');
  console.log(`   ${oldDbUrl.substring(0, 80)}...\n`);
  
  // Check if it's Aiven
  if (oldDbUrl.includes('aiven') || oldDbUrl.includes('pg-32be59aa')) {
    console.log('✅ This appears to be an AIVEN database!\n');
    console.log('💡 Aiven databases may have longer retention or backups\n');
    console.log('📝 Steps to check Aiven database:');
    console.log('   1. Go to: https://console.aiven.io/');
    console.log('   2. Find your PostgreSQL service (pg-32be59aa...)');
    console.log('   3. Check if the service is running');
    console.log('   4. Check for backups or point-in-time recovery\n');
  }
  
  // Try to connect
  console.log('🔄 Attempting to connect to old database...\n');
  
  try {
    const oldPrisma = new PrismaClient({
      datasources: {
        db: {
          url: oldDbUrl,
        },
      },
    });
    
    await oldPrisma.$connect();
    console.log('✅ Successfully connected to old database!\n');
    
    // Check data
    const productCount = await oldPrisma.product.count();
    const categoryCount = await oldPrisma.category.count();
    const imageCount = await oldPrisma.productImage.count();
    
    console.log('📦 Old Database State:');
    console.log(`   Products: ${productCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Product Images: ${imageCount}\n`);
    
    // Compare with current
    const currentPrisma = new PrismaClient();
    await currentPrisma.$connect();
    
    const currentProductCount = await currentPrisma.product.count();
    const currentCategoryCount = await currentPrisma.category.count();
    const currentImageCount = await currentPrisma.productImage.count();
    
    console.log('📊 Comparison:');
    console.log(`   Products: ${productCount} (old) vs ${currentProductCount} (current)`);
    console.log(`   Categories: ${categoryCount} (old) vs ${currentCategoryCount} (current)`);
    console.log(`   Images: ${imageCount} (old) vs ${currentImageCount} (current)\n`);
    
    if (productCount > 0 || categoryCount > 0) {
      console.log('✅ Old database has data! We can restore from it!\n');
      console.log('💡 Next step: Create a migration script to copy data from old to new\n');
    }
    
    await oldPrisma.$disconnect();
    await currentPrisma.$disconnect();
    
  } catch (error: any) {
    console.log('❌ Could not connect to old database\n');
    console.log(`   Error: ${error.message}\n`);
    
    if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.log('💡 The database might be:');
      console.log('   - Paused/stopped (check Aiven console)');
      console.log('   - Not accessible from your IP');
      console.log('   - Deleted or moved\n');
    }
    
    console.log('📝 Manual Steps:');
    console.log('   1. Check Aiven Console: https://console.aiven.io/');
    console.log('   2. Find your PostgreSQL service');
    console.log('   3. Start it if paused');
    console.log('   4. Get the connection string');
    console.log('   5. Try connecting again\n');
  }
}

checkOldDatabase().catch(console.error);
