import { CategoryService } from '../src/services/category.service';
import { prisma } from '../src/prisma/client';

async function deleteAllCategories() {
    try {
        console.log('🚀 Starting deletion of all categories...');
        
        const categoryService = new CategoryService();
        const result = await categoryService.deleteAllCategories();
        
        console.log('\n✅ Deletion completed successfully!');
        console.log('📊 Summary:');
        console.log(`   - Categories deleted: ${result.deletedCount}`);
        console.log(`   - Category Images deleted: ${result.deletedImages}`);
        
    } catch (error) {
        console.error('❌ Error deleting categories:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

deleteAllCategories();

