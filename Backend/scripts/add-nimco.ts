import { ProductService } from '../src/services/product.service';
import { prisma } from '../src/prisma/client';

interface ProductInput {
    name: string;
    unit: string;
    category: string;
    purchase_rate?: number | string;
    selling_price: number;
}

const products: ProductInput[] = [
    { name: "Bareeq Sev (250gms)", unit: "Pcs", category: "Nimco", purchase_rate: "Default", selling_price: 960 },
    { name: "Bareeq Gathiya (250gms)", unit: "Pcs", category: "Nimco", purchase_rate: "Default", selling_price: 960 },
    { name: "Bhel Poori (250gms)", unit: "Pcs", category: "Nimco", purchase_rate: "Default", selling_price: 960 },
    { name: "Boondian Bareeq (250gms)", unit: "Pcs", category: "Nimco", purchase_rate: "Default", selling_price: 1200 },
    { name: "Boondian (250gms)", unit: "Pcs", category: "Nimco", purchase_rate: "Default", selling_price: 1200 },
    { name: "Chat Papri (80gms)", unit: "Pcs", category: "Nimco", purchase_rate: "Default", selling_price: 1250 },
    { name: "Chewara (250gms)", unit: "Pcs", category: "Nimco", purchase_rate: "Default", selling_price: 960 },
    { name: "Daal Mooth (250gms)", unit: "Pcs", category: "Nimco", purchase_rate: "Default", selling_price: 960 },
    { name: "Manda Papri (150gms)", unit: "Pcs", category: "Nimco", purchase_rate: "Default", selling_price: 280 },
    { name: "Masalah Gathiya (300gms)", unit: "Pcs", category: "Nimco", purchase_rate: "Default", selling_price: 960 },
    { name: "Mix Nimco (250gms)", unit: "Pcs", category: "Nimco", purchase_rate: "Default", selling_price: 960 },
    { name: "Daal Moong (250 gms)", unit: "Pcs", category: "Nimco", purchase_rate: "Default", selling_price: 1120 },
    { name: "Sweet Chewara (250gms)", unit: "Pcs", category: "Nimco", purchase_rate: "Default", selling_price: 960 },
    { name: "Thick Gathiya (250gms)", unit: "Pcs", category: "Nimco", purchase_rate: "Default", selling_price: 960 },
];

async function addAllProducts() {
    const productService = new ProductService();
    const results = {
        success: [] as string[],
        failed: [] as { name: string; error: string }[],
    };

    console.log(`🚀 Starting to add ${products.length} products...\n`);

    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        try {
            // Handle products with "Default" or missing purchase rates
            let purchaseRate: number;
            if (product.purchase_rate === "Default" || !product.purchase_rate || product.purchase_rate === 0) {
                purchaseRate = product.selling_price > 0 ? Math.round(product.selling_price * 0.7) : 100;
            } else if (typeof product.purchase_rate === 'number') {
                purchaseRate = product.purchase_rate;
            } else {
                purchaseRate = product.selling_price > 0 ? Math.round(product.selling_price * 0.7) : 100;
            }
            
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

