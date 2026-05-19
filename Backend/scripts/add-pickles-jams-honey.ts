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
    { name: "Amla Murabba (500 gms)", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 400, selling_price: 550 },
    { name: "Amla Murabba KG", unit: "Kgs", category: "Pickles, Jams & Honey", purchase_rate: 800, selling_price: 1100 },
    { name: "Apple Murabba (500 gms)", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 400, selling_price: 550 },
    { name: "Ashrafi Murabba", unit: "Kgs", category: "Pickles, Jams & Honey", purchase_rate: 360, selling_price: 750 },
    { name: "Bahi Murabba (500 gms)", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 450, selling_price: 550 },
    { name: "Bahi Murabba KG", unit: "Kgs", category: "Pickles, Jams & Honey", purchase_rate: 900, selling_price: 1100 },
    { name: "Bailgiri Murabba (500 gms)", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 500, selling_price: 650 },
    { name: "Carrot Pickle", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 175, selling_price: 240 },
    { name: "Carrot Pickle Vinegar", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 105, selling_price: 280 },
    { name: "Dhoop Lemon (Vinegar)", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 175, selling_price: 400 },
    { name: "Garlic (Lehsan) Pickle", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 270, selling_price: 460 },
    { name: "Garlic (Lehsan) Pickle (vinegar)", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 245, selling_price: 400 },
    { name: "Green Chatni", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 175, selling_price: 240 },
    { name: "Green Chilli (Hari Mirch Long) Vinegar", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 175, selling_price: 320 },
    { name: "Green Chilli (Hari Mirch) Pickle", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 300, selling_price: 240 },
    { name: "Green Chilli (Vinegar)", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 175, selling_price: 260 },
    { name: "Gulqand Murabba", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 80, selling_price: 180 },
    { name: "Harr Ka Murabba", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 450, selling_price: 550 },
    { name: "Honey (Barry)", unit: "Kgs", category: "Pickles, Jams & Honey", purchase_rate: 1000, selling_price: 3600 },
    { name: "Honey (Paloosa)", unit: "Kgs", category: "Pickles, Jams & Honey", purchase_rate: 1000, selling_price: 1800 },
    { name: "Kakronde Murabba", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 100, selling_price: 220 },
    { name: "Kasondi Pickle", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 160, selling_price: 240 },
    { name: "Lasorah Pickle", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 175, selling_price: 240 },
    { name: "Lemon Pickle", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 175, selling_price: 240 },
    { name: "Mango Pickle", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 175, selling_price: 240 },
    { name: "Mixed Pickle 250 GM", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 160, selling_price: 240 },
    { name: "Mixed Pickle 500 GM", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 300, selling_price: 650 },
    { name: "Mixed Sabzi (Vinegar)", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 175, selling_price: 350 },
    { name: "Orange Peel Murabba", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 110, selling_price: 180 },
    { name: "Prunes Chatni", unit: "Pcs", category: "Pickles, Jams & Honey", purchase_rate: 270, selling_price: 600 },
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

