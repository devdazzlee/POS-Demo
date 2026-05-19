import * as dotenv from 'dotenv';
dotenv.config();

import { ProductService } from '../src/services/product.service';
import { CategoryService } from '../src/services/category.service';
import { prisma } from '../src/prisma/client';

async function deleteAllCategoriesAndProducts() {
    try {
        console.log('🚀 Starting deletion of all products and categories...');
        console.log('⚠️  WARNING: This will delete ALL products and categories from the database!\n');
        
        // Step 1: Delete all products first (since products reference categories)
        // Also delete additional product-related records that the service method doesn't handle
        console.log('📦 Step 1: Deleting all products and related data...');
        
        // Delete additional product-related records first
        const deletedPurchases = await prisma.purchase.deleteMany({});
        const deletedTransfers = await prisma.transfer.deleteMany({});
        const deletedStockAdjustments = await prisma.stockAdjustment.deleteMany({});
        
        console.log(`   - Purchase records deleted: ${deletedPurchases.count}`);
        console.log(`   - Transfer records deleted: ${deletedTransfers.count}`);
        console.log(`   - Stock Adjustment records deleted: ${deletedStockAdjustments.count}`);
        
        // Now delete products using the service method
        const productService = new ProductService();
        const productResult = await productService.deleteAllProducts();
        
        console.log('✅ Products deletion completed!');
        console.log('📊 Products Summary:');
        console.log(`   - Products deleted: ${productResult.deletedCount}`);
        console.log(`   - Product Images deleted: ${productResult.deletedImages}`);
        console.log(`   - Stock records deleted: ${productResult.deletedStocks}`);
        console.log(`   - Stock Movements deleted: ${productResult.deletedStockMovements}`);
        console.log(`   - Sale Items deleted: ${productResult.deletedSaleItems}`);
        console.log(`   - Purchase Order Items deleted: ${productResult.deletedPurchaseOrderItems}`);
        console.log(`   - Order Items deleted: ${productResult.deletedOrderItems}\n`);
        
        // Step 2: Delete all categories (after products are deleted)
        console.log('📁 Step 2: Deleting all categories and related data...');
        const categoryService = new CategoryService();
        const categoryResult = await categoryService.deleteAllCategories();
        
        console.log('✅ Categories deletion completed!');
        console.log('📊 Categories Summary:');
        console.log(`   - Categories deleted: ${categoryResult.deletedCount}`);
        console.log(`   - Category Images deleted: ${categoryResult.deletedImages}\n`);
        
        console.log('🎉 All deletions completed successfully!');
        console.log('\n📈 Total Summary:');
        console.log(`   - Total Products deleted: ${productResult.deletedCount}`);
        console.log(`   - Total Categories deleted: ${categoryResult.deletedCount}`);
        console.log(`   - Additional records deleted:`);
        console.log(`     * Purchases: ${deletedPurchases.count}`);
        console.log(`     * Transfers: ${deletedTransfers.count}`);
        console.log(`     * Stock Adjustments: ${deletedStockAdjustments.count}`);
        
    } catch (error) {
        console.error('❌ Error deleting categories and products:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

deleteAllCategoriesAndProducts();
