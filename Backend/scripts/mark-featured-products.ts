import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function markFeaturedProducts() {
    try {
        console.log('Starting to mark products as featured...');

        // Get some active products to mark as featured
        // We'll select products from different categories
        const products = await prisma.product.findMany({
            where: {
                is_active: true,
                display_on_pos: true,
            },
            orderBy: {
                created_at: 'desc',
            },
            take: 20, // Mark up to 20 products as featured
            include: {
                category: true,
            },
        });

        if (products.length === 0) {
            console.log('No products found to mark as featured.');
            return;
        }

        console.log(`Found ${products.length} products. Marking first 10-12 as featured...`);

        // Mark first 10-12 products as featured (ensuring variety)
        const productsToFeature = products.slice(0, Math.min(12, products.length));
        
        let featuredCount = 0;
        for (const product of productsToFeature) {
            await prisma.product.update({
                where: { id: product.id },
                data: { is_featured: true },
            });
            featuredCount++;
            console.log(`✓ Marked "${product.name}" as featured`);
        }

        console.log(`\n✅ Successfully marked ${featuredCount} products as featured!`);
        
        // Verify
        const featuredProducts = await prisma.product.findMany({
            where: {
                is_featured: true,
                is_active: true,
            },
            select: {
                id: true,
                name: true,
                is_featured: true,
            },
        });

        console.log(`\n📊 Total featured products: ${featuredProducts.length}`);
        console.log('\nFeatured Products:');
        featuredProducts.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.name}`);
        });

    } catch (error) {
        console.error('Error marking products as featured:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
markFeaturedProducts()
    .then(() => {
        console.log('\n✨ Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });

