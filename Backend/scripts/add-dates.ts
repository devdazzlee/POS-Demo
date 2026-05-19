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
    { name: "Ajwa Dates Small", unit: "Kgs", category: "Dates", purchase_rate: 2600, selling_price: 4800 },
    { name: "Irani Dates (Box)", unit: "Pcs", category: "Dates", purchase_rate: 324.58, selling_price: 550 },
    { name: "Kalmi Dates", unit: "Kgs", category: "Dates", purchase_rate: 2300, selling_price: 3600 },
    { name: "Mabroom Dates", unit: "Kgs", category: "Dates", purchase_rate: 2100, selling_price: 4800 },
    { name: "Punjgor Dates", unit: "Kgs", category: "Dates", purchase_rate: 412.5, selling_price: 1200 },
    { name: "Sugai Dates", unit: "Kgs", category: "Dates", purchase_rate: 550, selling_price: 3200 },
    { name: "Ajwa Powder", unit: "Pcs", category: "Dates", purchase_rate: 600, selling_price: 1200 },
    { name: "Ajwa Paste", unit: "Pcs", category: "Dates", purchase_rate: 900, selling_price: 1500 },
    { name: "Amber Dates", unit: "Kgs", category: "Dates", purchase_rate: 2750, selling_price: 4800 },
    { name: "Zahidi Dates", unit: "Kgs", category: "Dates", purchase_rate: 430, selling_price: 1200 },
    { name: "Rabbai Dates", unit: "Kgs", category: "Dates", purchase_rate: 680, selling_price: 1400 },
    { name: "Sukhri Dates", unit: "Kgs", category: "Dates", purchase_rate: 2040, selling_price: 4800 },
    { name: "Medjool Dates", unit: "Kgs", category: "Dates", purchase_rate: 0, selling_price: 6000 },
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

