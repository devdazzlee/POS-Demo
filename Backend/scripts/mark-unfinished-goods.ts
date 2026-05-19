/**
 * Script to mark "Unfinished Goods" products as NOT for sale (display_on_pos: false)
 * 
 * Per client requirement (Konain Bhai 1/5/2026):
 * "Unfinished Goods" are just for Admin inventory - Not for sale.
 * 
 * Products to be marked as NOT for sale:
 * - EMPTY FOOD COLOR DIBYA
 * - Empty Murabba bottles
 * - Saffron ( 1 gm ) dibya
 * 
 * Run with: npx ts-node scripts/mark-unfinished-goods.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// List of product names that are "Unfinished Goods" - NOT for sale
const UNFINISHED_GOODS_PATTERNS = [
  'EMPTY FOOD COLOR DIBYA',
  'Empty Murabba bottles',
  'Saffron ( 1 gm ) dibya',
  // Add more products here as needed
  'empty dibya',
  'empty bottle',
  'empty container',
  'packing material',
  'unfinished',
];

async function markUnfinishedGoodsAsNotForSale() {
  console.log('🚀 Starting to mark Unfinished Goods as NOT for sale...\n');

  try {
    // First, let's see what products match our patterns
    const matchingProducts = await prisma.product.findMany({
      where: {
        OR: UNFINISHED_GOODS_PATTERNS.map(pattern => ({
          name: {
            contains: pattern,
            mode: 'insensitive' as const,
          },
        })),
      },
      select: {
        id: true,
        name: true,
        display_on_pos: true,
        is_active: true,
      },
    });

    console.log(`📦 Found ${matchingProducts.length} products matching "Unfinished Goods" patterns:\n`);
    
    matchingProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name}`);
      console.log(`     - Currently display_on_pos: ${product.display_on_pos}`);
      console.log(`     - Currently is_active: ${product.is_active}`);
    });

    if (matchingProducts.length === 0) {
      console.log('\n⚠️  No matching products found. Please check the product names in the database.');
      return;
    }

    // Ask for confirmation (in a script, we'll just proceed)
    console.log('\n📝 Updating products to display_on_pos: false...\n');

    // Update all matching products
    const updateResult = await prisma.product.updateMany({
      where: {
        id: {
          in: matchingProducts.map(p => p.id),
        },
      },
      data: {
        display_on_pos: false, // NOT displayed on POS/Cash Counter
        is_active: true, // Keep active for inventory management
      },
    });

    console.log(`✅ Successfully updated ${updateResult.count} products!`);
    console.log('   - These products will NOT appear on POS/Cash Counter');
    console.log('   - These products will still appear in Admin Inventory');

    // Also create/ensure "Unfinished Goods" category exists
    console.log('\n📁 Checking for "Unfinished Goods" category...');
    
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: 'Unfinished Goods',
          mode: 'insensitive',
        },
      },
    });

    if (existingCategory) {
      console.log(`   Category already exists: ${existingCategory.name} (ID: ${existingCategory.id})`);
      
      // Update category to NOT display on POS
      await prisma.category.update({
        where: { id: existingCategory.id },
        data: { display_on_pos: false },
      });
      console.log('   Updated category display_on_pos to false');
    } else {
      // Create the category
      const lastCategory = await prisma.category.findFirst({
        orderBy: { created_at: 'desc' },
        select: { code: true },
      });
      
      const newCode = lastCategory 
        ? (parseInt(lastCategory.code) + 1).toString() 
        : '1000';
      
      const newCategory = await prisma.category.create({
        data: {
          name: 'Unfinished Goods',
          slug: 'unfinished-goods',
          code: newCode,
          is_active: true,
          display_on_pos: false, // NOT displayed on POS
        },
      });
      
      console.log(`   Created new category: ${newCategory.name} (ID: ${newCategory.id})`);
      console.log('   - display_on_pos: false (will NOT show on Cash Counter)');
    }

    console.log('\n🎉 Done! Unfinished Goods configuration complete.');
    console.log('\nIMPORTANT:');
    console.log('- Products with display_on_pos: false will NOT appear on POS/Cash Counter');
    console.log('- They WILL appear in Admin Inventory for stock management');
    console.log('- To add more products to this list, either:');
    console.log('  1. Set display_on_pos: false manually in Admin Inventory');
    console.log('  2. Add the product name pattern to this script and re-run');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Also export a function to mark a specific product
async function markProductAsNotForSale(productId: string) {
  return prisma.product.update({
    where: { id: productId },
    data: { display_on_pos: false },
  });
}

// Run the main function
markUnfinishedGoodsAsNotForSale();
