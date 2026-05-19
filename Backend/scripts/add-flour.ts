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
    { name: "Barley Flour (Jau Aata)", unit: "Kgs", category: "Flour", purchase_rate: 240, selling_price: 480 },
    { name: "Besan (Gram Flour)", unit: "Kgs", category: "Flour", purchase_rate: 340, selling_price: 480 },
    { name: "Chakki Aata", unit: "Kgs", category: "Flour", purchase_rate: 140, selling_price: 750 },
    { name: "Channay Ka Sattu", unit: "Kgs", category: "Flour", purchase_rate: 220, selling_price: 500 },
    { name: "Corn Flour", unit: "Kgs", category: "Flour", purchase_rate: 160, selling_price: 280 },
    { name: "Jau Ka Sattu", unit: "Kgs", category: "Flour", purchase_rate: 220, selling_price: 500 },
    { name: "Maash Flour", unit: "Kgs", category: "Flour", purchase_rate: 640, selling_price: 920 },
    { name: "Maida (All Purpose Flour)", unit: "Kgs", category: "Flour", purchase_rate: 150, selling_price: 280 },
    { name: "Makai ka Aata", unit: "Kgs", category: "Flour", purchase_rate: 200, selling_price: 340 },
    { name: "Millets Flour (Bajra Atta)", unit: "Kgs", category: "Flour", purchase_rate: 220, selling_price: 320 },
    { name: "Moong Flour", unit: "Kgs", category: "Flour", purchase_rate: 520, selling_price: 800 },
    { name: "Rice Flour", unit: "Kgs", category: "Flour", purchase_rate: 200, selling_price: 480 },
    { name: "Suji (Semolina)", unit: "Kgs", category: "Flour", purchase_rate: 160, selling_price: 360 },
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

