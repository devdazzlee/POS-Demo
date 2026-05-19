import { prisma } from '../src/prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function restoreCorrectImages() {
  console.log('🔄 Restoring correct images from backup data...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Load the replacement file which has the old (correct) images
  const replacementsPath = path.resolve(__dirname, '../feb-mar-image-replacements.json');
  
  if (!fs.existsSync(replacementsPath)) {
    console.error('❌ Replacement file not found. Cannot restore images.');
    process.exit(1);
  }
  
  const replacements = JSON.parse(fs.readFileSync(replacementsPath, 'utf-8'));
  const matches = replacements.matches || [];
  
  console.log(`📋 Found ${matches.length} image replacements to restore\n`);
  
  // Filter to only those that have oldImage (the correct one)
  const toRestore = matches.filter((m: any) => m.oldImage && m.oldImage !== m.newImage);
  
  console.log(`🔄 Restoring ${toRestore.length} products with correct images...\n`);
  
  let restored = 0;
  let failed = 0;
  const failedProducts: string[] = [];
  
  // Get all products to map names to IDs
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  
  const productMap = new Map(products.map(p => [p.name, p.id]));
  
  for (const match of toRestore) {
    try {
      const productId = productMap.get(match.productName);
      
      if (!productId) {
        console.log(`⚠️  Product not found: ${match.productName}`);
        failed++;
        failedProducts.push(match.productName);
        continue;
      }
      
      // Find or create product image record
      const existingImage = await prisma.productImage.findFirst({
        where: { product_id: productId },
      });
      
      if (existingImage) {
        // Update with correct image
        await prisma.productImage.update({
          where: { id: existingImage.id },
          data: {
            image: match.oldImage,
            status: 'COMPLETE',
            is_active: true,
          },
        });
      } else {
        // Create new record
        await prisma.productImage.create({
          data: {
            product_id: productId,
            image: match.oldImage,
            status: 'COMPLETE',
            is_active: true,
          },
        });
      }
      
      // Update product has_images flag
      await prisma.product.update({
        where: { id: productId },
        data: { has_images: true },
      });
      
      restored++;
      
      if (restored % 20 === 0) {
        console.log(`   Restored ${restored}/${toRestore.length}...`);
      }
    } catch (error) {
      failed++;
      failedProducts.push(match.productName);
      console.error(`❌ Failed to restore ${match.productName}: ${(error as Error).message}`);
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   ✅ Restored: ${restored} products`);
  console.log(`   ❌ Failed: ${failed} products`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (failedProducts.length > 0) {
    console.log('⚠️  Failed products:');
    failedProducts.forEach(name => console.log(`   - ${name}`));
    console.log('');
  }
  
  console.log('✅ Image restoration completed!\n');
  console.log('💡 Note: This only restores product images.');
  console.log('   For a complete database restore to 2 days ago, use Neon time-travel.\n');
  
  await prisma.$disconnect();
}

restoreCorrectImages().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
