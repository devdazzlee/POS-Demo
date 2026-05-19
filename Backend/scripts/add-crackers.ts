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
    { name: "Aalu Masala Crackers", unit: "Pcs", category: "Crackers", purchase_rate: 65, selling_price: 120 },
    { name: "Aalu Crackers", unit: "Pcs", category: "Crackers", purchase_rate: 65, selling_price: 120 },
    { name: "Mixed Crackers", unit: "Kgs", category: "Crackers", purchase_rate: 390, selling_price: 100 },
    { name: "Ball Crackers", unit: "Kgs", category: "Crackers", purchase_rate: 360, selling_price: 680 },
    { name: "Chicken Crackers", unit: "Pcs", category: "Crackers", purchase_rate: 70, selling_price: 100 },
    { name: "Chinese Crackers", unit: "Pcs", category: "Crackers", purchase_rate: 40, selling_price: 1800 },
    { name: "Crazy & Crispy Crackers", unit: "Pcs", category: "Crackers", purchase_rate: 70, selling_price: 280 },
    { name: "Dashi Prawn Crackers", unit: "Pcs", category: "Crackers", purchase_rate: 240, selling_price: 160 },
    { name: "Farfar Crackers", unit: "Pcs", category: "Crackers", purchase_rate: 40, selling_price: 250 },
    { name: "Flower Crackers", unit: "Kgs", category: "Crackers", purchase_rate: 360, selling_price: 5800 },
    { name: "Kachori Papad", unit: "Pcs", category: "Crackers", purchase_rate: 60, selling_price: 50 },
    { name: "Khichiya Papad", unit: "Pcs", category: "Crackers", purchase_rate: 80, selling_price: 1200 },
    { name: "Mix Daal Papad", unit: "Pcs", category: "Crackers", purchase_rate: 60, selling_price: 280 },
    { name: "Pipe Crackers", unit: "Pcs", category: "Crackers", purchase_rate: 70, selling_price: 550 },
    { name: "Potato Chips", unit: "Pcs", category: "Crackers", purchase_rate: 90, selling_price: 880 },
    { name: "Punjabi Masalah Papad", unit: "Pcs", category: "Crackers", purchase_rate: 187, selling_price: 0 },
    { name: "Racket Crackers", unit: "Kgs", category: "Crackers", purchase_rate: 360, selling_price: 8000 },
    { name: "Rice Crackers", unit: "Pcs", category: "Crackers", purchase_rate: 48, selling_price: 8000 },
    { name: "Ring Crackers", unit: "Pcs", category: "Crackers", purchase_rate: 60, selling_price: 550 },
    { name: "Sabzi Masalah Crackers", unit: "Pcs", category: "Crackers", purchase_rate: 70, selling_price: 320 },
    { name: "Slanty Crackers", unit: "Kgs", category: "Crackers", purchase_rate: 500, selling_price: 80 },
    { name: "Shell Crackers", unit: "Pcs", category: "Crackers", purchase_rate: 170, selling_price: 450 },
    { name: "Sindhi Masalah Papad", unit: "Pcs", category: "Crackers", purchase_rate: 187, selling_price: 20000 },
    { name: "Wave Crackers", unit: "Pcs", category: "Crackers", purchase_rate: 25, selling_price: 300 },
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

