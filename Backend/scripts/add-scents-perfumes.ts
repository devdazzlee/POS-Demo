import { ProductService } from '../src/services/product.service';
import { prisma } from '../src/prisma/client';

interface ProductInput {
    name: string;
    unit: string;
    category: string;
    purchase_rate?: number | string | undefined;
    selling_price?: number | string | undefined;
}

const products: ProductInput[] = [
    { name: "Al Mataf Scent", unit: "Pcs", category: "SCENT & PERFUMES", purchase_rate: 4800, selling_price: 1200 },
    { name: "Amir Al Oud Scent", unit: "Pcs", category: "SCENT & PERFUMES", purchase_rate: 6000, selling_price: 1200 },
    { name: "Oud Wood Scent", unit: "Pcs", category: "SCENT & PERFUMES", purchase_rate: 4200, selling_price: 1200 },
    { name: "Kalemat Scent", unit: "Pcs", category: "SCENT & PERFUMES", purchase_rate: 5300, selling_price: 1200 },
    { name: "Air Freshener Spray", unit: "Pcs", category: "SCENT & PERFUMES", purchase_rate: 1920, selling_price: 3000 },
    { name: "Fancy Burner", unit: "Pcs", category: "SCENT & PERFUMES", purchase_rate: 450, selling_price: 1200 },
    { name: "Bakhoor", unit: "Pcs", category: "SCENT & PERFUMES", purchase_rate: 315, selling_price: 550 },
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
            // Handle products with missing or "Default" purchase rates
            let purchaseRate: number;
            const purchaseRateValue = product.purchase_rate;
            
            if (!purchaseRateValue || purchaseRateValue === "Default" || purchaseRateValue === "" || purchaseRateValue === 0) {
                // Calculate from selling price if available
                if (product.selling_price && typeof product.selling_price === 'number' && product.selling_price > 0) {
                    purchaseRate = Math.round(product.selling_price * 0.7);
                } else {
                    purchaseRate = 100; // Default fallback
                }
            } else if (typeof purchaseRateValue === 'number') {
                purchaseRate = purchaseRateValue;
            } else {
                purchaseRate = 100; // Default fallback
            }
            
            // Handle products with missing selling prices
            let sellingPrice: number;
            const sellingPriceValue = product.selling_price;
            
            if (!sellingPriceValue || sellingPriceValue === "" || sellingPriceValue === 0) {
                // Calculate from purchase rate if available
                if (purchaseRate > 0) {
                    sellingPrice = Math.round(purchaseRate * 1.5);
                } else {
                    sellingPrice = 100; // Default fallback
                }
            } else if (typeof sellingPriceValue === 'number') {
                sellingPrice = sellingPriceValue;
            } else {
                sellingPrice = 100; // Default fallback
            }

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

