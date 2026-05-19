import { ProductService } from '../src/services/product.service';
import { prisma } from '../src/prisma/client';

async function deleteAllProducts() {
    try {
        console.log('🚀 Starting deletion of all products...');
        
        const productService = new ProductService();
        const result = await productService.deleteAllProducts();
        
        console.log('\n✅ Deletion completed successfully!');
        console.log('📊 Summary:');
        console.log(`   - Products deleted: ${result.deletedCount}`);
        console.log(`   - Product Images deleted: ${result.deletedImages}`);
        console.log(`   - Stock records deleted: ${result.deletedStocks}`);
        console.log(`   - Stock Movements deleted: ${result.deletedStockMovements}`);
        console.log(`   - Sale Items deleted: ${result.deletedSaleItems}`);
        console.log(`   - Purchase Order Items deleted: ${result.deletedPurchaseOrderItems}`);
        console.log(`   - Order Items deleted: ${result.deletedOrderItems}`);
        
    } catch (error) {
        console.error('❌ Error deleting products:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

deleteAllProducts();

