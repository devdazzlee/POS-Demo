import { ProductService } from '../src/services/product.service';
import { prisma } from '../src/prisma/client';

interface ProductInput {
    name: string;
    unit: string;
    category: string;
    purchase_rate?: number;
    selling_price: number;
}

const products: ProductInput[] = [
    { name: "Almond Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 2670, selling_price: 4800 },
    { name: "Black Sesame Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 900, selling_price: 1600 },
    { name: "Cashew Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 3270, selling_price: 4800 },
    { name: "Chickpeas Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 790, selling_price: 1200 },
    { name: "Coconut Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 1150, selling_price: 1600 },
    { name: "Flat Gajak", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 650, selling_price: 1200 },
    { name: "Flax Seeds Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 500, selling_price: 2000 },
    { name: "Gajak Roll Box", unit: "Pcs", category: "Traditional Confectionery", purchase_rate: 650, selling_price: 700 },
    { name: "Mixed Nuts Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 3870, selling_price: 5600 },
    { name: "Peanut Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 900, selling_price: 1200 },
    { name: "Pehalwan Reawri (250gms)", unit: "Pcs", category: "Traditional Confectionery", purchase_rate: 600, selling_price: 280 },
    { name: "Pehalwan Reawri (500gms)", unit: "Pcs", category: "Traditional Confectionery", purchase_rate: 600, selling_price: 560 },
    { name: "Pistachio Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 5000, selling_price: 8000 },
    { name: "Puffed Rice Balls", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 80, selling_price: 150 },
    { name: "Puffed Rice Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 185, selling_price: 300 },
    { name: "Reawri", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 350, selling_price: 1200 },
    { name: "Roti Gajak", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 650, selling_price: 1200 },
    { name: "Round Gajak", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 650, selling_price: 1200 },
    { name: "Sesame Balls (Small)", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 650, selling_price: 300 },
    { name: "Sesame Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 400, selling_price: 1200 },
];

async function addAllProducts() {
    const productService = new ProductService();
    const results = {
        success: [] as string[],
        failed: [] as { name: string; error: string }[],
    };

    const categoryName = 'Traditional Confectionery';
    const category = await prisma.category.findFirst({
        where: {
            name: {
                equals: categoryName,
                mode: 'insensitive',
            },
        },
        include: {
            CategoryImages: {
                where: { status: 'COMPLETE' },
                orderBy: { created_at: 'asc' },
                select: { image: true },
            },
        },
    });

    if (!category) {
        throw new Error(`Category "${categoryName}" not found`);
    }

    const mainCategoryImageUrl = category.CategoryImages?.[0]?.image;
    if (!mainCategoryImageUrl) {
        throw new Error(`No COMPLETE category image found for "${categoryName}"`);
    }

    console.log(`🚀 Starting to add ${products.length} products...\n`);
    console.log(`🖼️ Using category image for all products: ${mainCategoryImageUrl}\n`);

    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        try {
            // Handle products with 0 or missing prices
            let purchaseRate = product.purchase_rate && product.purchase_rate > 0 
                ? product.purchase_rate 
                : (product.selling_price > 0 ? Math.round(product.selling_price * 0.7) : 100);
            
            let sellingPrice = product.selling_price > 0 
                ? product.selling_price 
                : (purchaseRate > 0 ? Math.round(purchaseRate * 1.5) : 100);

            const created = await productService.createProductFromBulkUpload({
                name: product.name,
                category_name: product.category,
                unit_name: product.unit,
                purchase_rate: purchaseRate,
                sales_rate_exc_dis_and_tax: sellingPrice,
                sales_rate_inc_dis_and_tax: sellingPrice,
                min_qty: 10,
                max_qty: 10,
            });

            const existingMainImage = await prisma.productImage.findFirst({
                where: {
                    product_id: created.id,
                    image: mainCategoryImageUrl,
                    status: 'COMPLETE',
                },
                select: { id: true },
            });

            if (!existingMainImage) {
                await prisma.productImage.create({
                    data: {
                        product_id: created.id,
                        image: mainCategoryImageUrl,
                        status: 'COMPLETE',
                    },
                });
            }

            await prisma.product.update({
                where: { id: created.id },
                data: { has_images: true },
            });

            results.success.push(product.name);
            console.log(`✅ [${i + 1}/${products.length}] ${product.name} - Created (ID: ${created.id})`);
        } catch (error) {
            const errorMessage = (error as Error).message;
            results.failed.push({ name: product.name, error: errorMessage });
            console.error(`❌ [${i + 1}/${products.length}] ${product.name} - Failed: ${errorMessage}`);
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully created: ${results.success.length} products`);
    console.log(`   ❌ Failed: ${results.failed.length} products`);
    
    if (results.failed.length > 0) {
        console.log('\n❌ Failed products:');
        results.failed.forEach(({ name, error }) => {
            console.log(`   - ${name}: ${error}`);
        });
    }
}

addAllProducts()
    .then(() => {
        console.log('\n✅ Process completed!');
        return prisma.$disconnect();
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });

