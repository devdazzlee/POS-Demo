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
    { name: "Almonds Whole (Kaghzi)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1750, selling_price: 2800 },
    { name: "Almonds Whole (Katha)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 800, selling_price: 1200 },
    { name: "Almonds Whole (Wahidi)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1750, selling_price: 2400 },
    { name: "American Almonds large", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3450, selling_price: 4800 },
    { name: "American Almonds Medium", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 2650, selling_price: 4000 },
    { name: "American Almonds Small", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 2550, selling_price: 3600 },
    { name: "Apricot's Seed's Almonds", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1350, selling_price: 2200 },
    { name: "Banana Chips (Salted)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 0, selling_price: 2800 },
    { name: "Banana Chips (Spicy)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 0, selling_price: 2800 },
    { name: "Black Raisins (Kaali Kishmish)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1200, selling_price: 1800 },
    { name: "Coconut (Grated)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1300, selling_price: 2000 },
    { name: "Coconut (Grounded)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1800, selling_price: 2600 },
    { name: "Coconut (Half Piece)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1400, selling_price: 1800 },
    { name: "Dried Apricot with Seed", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1200, selling_price: 2400 },
    { name: "Dried Apricot without Seed (Golden)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1300, selling_price: 2200 },
    { name: "Dried Cherry", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 0, selling_price: 5600 },
    { name: "Dried Dates (Chuwara)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 450, selling_price: 1000 },
    { name: "Dried Dates (Nar Chuwara)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 680, selling_price: 1600 },
    { name: "Dried Figs ( Persian )", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1600, selling_price: 4800 },
    { name: "Dried Maango", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 0, selling_price: 5600 },
    { name: "Dried Pineapple", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 0, selling_price: 5600 },
    { name: "Dried Strawberry", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 0, selling_price: 5600 },
    { name: "Figs (Extra Large)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1400, selling_price: 6400 },
    { name: "Figs (Large)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1200, selling_price: 4800 },
    { name: "Figs (Medium)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1000, selling_price: 4400 },
    { name: "Figs (Small)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 800, selling_price: 3600 },
    { name: "Figs Turkish", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3400, selling_price: 6800 },
    { name: "Flavoured Cashews (BBQ)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 0, selling_price: 7200 },
    { name: "Flavoured Cashews (Black Pepper)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 0, selling_price: 7200 },
    { name: "Flavoured Cashews (Cheese)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 0, selling_price: 7200 },
    { name: "Flavoured Cashews (Jalapeno)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 0, selling_price: 7200 },
    { name: "Flavoured Cashews (Peri Peri)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 0, selling_price: 7200 },
    { name: "Gum Crystal (gondh babool)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 750, selling_price: 1600 },
    { name: "Kandhari Almonds", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1200, selling_price: 2400 },
    { name: "Makhana", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 4200, selling_price: 8000 },
    { name: "Mixed Dried Fruits", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 0, selling_price: 5600 },
    { name: "Mixed Melon Seeds (4 Maghaz)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1300, selling_price: 3200 },
    { name: "Mixed Nuts", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1500, selling_price: 5400 },
    { name: "Munaqqa", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 850, selling_price: 2000 },
    { name: "Persian Almonds", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 4900, selling_price: 7200 },
    { name: "Pine Seeds (Shell)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 4500, selling_price: 8000 },
    { name: "Pine Seeds (Shell) GOLD", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 6500, selling_price: 9600 },
    { name: "Pine Seeds W/O Shell", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 9500, selling_price: 12000 },
    { name: "Pine Seeds W/O Shell GOLD", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 9500, selling_price: 16000 },
    { name: "Plain Cashews (180)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 4200, selling_price: 6400 },
    { name: "Plain Cashews (240)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3800, selling_price: 4800 },
    { name: "Plain Cashews (320)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3600, selling_price: 4400 },
    { name: "Plain Pistachios", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 5400, selling_price: 9600 },
    { name: "Pumpkin Seeds Peeled", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1300, selling_price: 3600 },
    { name: "Pumpkin Seeds Whole (Long)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1600, selling_price: 2400 },
    { name: "Pumpkin Seeds Whole (round)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 750, selling_price: 1600 },
    { name: "Raisins (Sundarkhani)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1200, selling_price: 2400 },
    { name: "Raisins Round", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 800, selling_price: 1800 },
    { name: "Roasted Almonds", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3000, selling_price: 4800 },
    { name: "Roasted Cashew Nuts (180)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 4200, selling_price: 6800 },
    { name: "Roasted Cashew Nuts (240)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 4000, selling_price: 5600 },
    { name: "Roasted Cashew Nuts (320)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3800, selling_price: 4800 },
    { name: "Roasted Peanuts", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 700, selling_price: 1000 },
    { name: "Roasted Peanuts (Whole)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1300, selling_price: 1800 },
    { name: "Roasted Pistachios", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3800, selling_price: 5600 },
    { name: "Salted Peanuts", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 840, selling_price: 1280 },
    { name: "Salted Pistachios", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3400, selling_price: 5600 },
    { name: "Sliced Almonds", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 2500, selling_price: 4800 },
    { name: "Sliced Coconuts", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1450, selling_price: 2400 },
    { name: "Sliced Dried Dates (Chuwara)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 550, selling_price: 1400 },
    { name: "Sliced Pistachios", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 4500, selling_price: 10000 },
    { name: "Sliced Plain Cashews", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 2000, selling_price: 3200 },
    { name: "Smoked Almonds", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3000, selling_price: 4800 },
    { name: "Spicy Peanuts", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 840, selling_price: 1280 },
    { name: "Sweet Almonds", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3200, selling_price: 6800 },
    { name: "Unroasted Peanuts", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 680, selling_price: 1600 },
    { name: "Unroasted Peanuts (Skin)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 680, selling_price: 1600 },
    { name: "Walnuts", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 2400, selling_price: 4400 },
    { name: "Walnuts (GOLA)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 2600, selling_price: 4800 },
    { name: "Walnuts Whole", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 750, selling_price: 1800 },
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
            // If purchase_rate is 0 or missing, use 70% of selling price as default
            const purchaseRate = product.purchase_rate && product.purchase_rate > 0 
                ? product.purchase_rate 
                : Math.round(product.selling_price * 0.7);

            const created = await productService.createProductFromBulkUpload({
                name: product.name,
                category_name: product.category,
                unit_name: product.unit,
                purchase_rate: purchaseRate,
                sales_rate_exc_dis_and_tax: product.selling_price,
                sales_rate_inc_dis_and_tax: product.selling_price,
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

