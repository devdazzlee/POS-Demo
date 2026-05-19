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
    { name: "2 Piece Betel Nut", unit: "Kgs", category: "General", purchase_rate: 1800, selling_price: 4000 },
    { name: "Baryan", unit: "Pcs", category: "General", purchase_rate: 57.58, selling_price: 150 },
    { name: "Batashay", unit: "Kgs", category: "General", purchase_rate: 250, selling_price: 1000 },
    { name: "Brown Sugar", unit: "Kgs", category: "General", purchase_rate: 200, selling_price: 360 },
    { name: "China Grass (Whole)", unit: "Pcs", category: "General", purchase_rate: 35, selling_price: 80 },
    { name: "China Grass Large (Grounded)", unit: "Pcs", category: "General", purchase_rate: 55, selling_price: 100 },
    { name: "China Grass Small (Grounded)", unit: "Pcs", category: "General", purchase_rate: 35, selling_price: 80 },
    { name: "Dahi Mirch", unit: "Pcs", category: "General", purchase_rate: 200, selling_price: 250 },
    { name: "Desi Ghee", unit: "Kgs", category: "General", purchase_rate: 900, selling_price: 1800 },
    { name: "Dhala Misri", unit: "Kgs", category: "General", purchase_rate: 250, selling_price: 800 },
    { name: "Dhanya giri", unit: "Kgs", category: "General", purchase_rate: 1120, selling_price: 1800 },
    { name: "Essence", unit: "Pcs", category: "General", purchase_rate: 50, selling_price: 80 },
    { name: "Fennel Seeds (Sweet)", unit: "Kgs", category: "General", purchase_rate: 280, selling_price: 600 },
    { name: "Fine Coal", unit: "Pcs", category: "General", purchase_rate: 60, selling_price: 150 },
    { name: "Flavoured Silli Betel Nut", unit: "Kgs", category: "General", purchase_rate: 3400, selling_price: 6000 },
    { name: "Flavoured Sunny Betel Nut", unit: "Kgs", category: "General", purchase_rate: 3400, selling_price: 6000 },
    { name: "Food Colour", unit: "Pcs", category: "General", purchase_rate: 5, selling_price: 40 },
    { name: "ghuriyan", unit: "Kgs", category: "General", purchase_rate: 500, selling_price: 800 },
    { name: "Glass Gurr", unit: "Pcs", category: "General", purchase_rate: 85, selling_price: 140 },
    { name: "Jaggery (Gurr)", unit: "Kgs", category: "General", purchase_rate: 220, selling_price: 360 },
    { name: "Jaggery (Kala Gurr)", unit: "Kgs", category: "General", purchase_rate: 250, selling_price: 380 },
    { name: "Kaccha Chewra (Pawa)", unit: "Kgs", category: "General", purchase_rate: 320, selling_price: 600 },
    { name: "Key Kewra Water (300ml)", unit: "Pcs", category: "General", purchase_rate: 80, selling_price: 120 },
    { name: "khushboo dana", unit: "Kgs", category: "General", purchase_rate: 480, selling_price: 800 },
    { name: "Laccha", unit: "Pcs", category: "General", purchase_rate: 90, selling_price: 200 },
    { name: "Mango Slice", unit: "Pcs", category: "General", purchase_rate: 70, selling_price: 140 },
    { name: "Misri", unit: "Kgs", category: "General", purchase_rate: 340, selling_price: 800 },
    { name: "MIx Sweets", unit: "Pcs", category: "General", purchase_rate: 0, selling_price: 1600 },
    { name: "MP Chat Hazam Chooran", unit: "Pcs", category: "General", purchase_rate: 80, selling_price: 150 },
    { name: "Naqqul (large)", unit: "Kgs", category: "General", purchase_rate: 220, selling_price: 400 },
    { name: "Naqqul (small)", unit: "Kgs", category: "General", purchase_rate: 220, selling_price: 400 },
    { name: "Popcorn", unit: "Kgs", category: "General", purchase_rate: 320, selling_price: 700 },
    { name: "Puffed Rice (Murmuray)", unit: "Kgs", category: "General", purchase_rate: 320, selling_price: 600 },
    { name: "Red Anmol Betel Nut", unit: "Kgs", category: "General", purchase_rate: 540, selling_price: 800 },
    { name: "Rita Tamarind (M)", unit: "Pcs", category: "General", purchase_rate: 11.67, selling_price: 40 },
    { name: "Roasted Paan Masala", unit: "Kgs", category: "General", purchase_rate: 1250, selling_price: 1800 },
    { name: "Saffron (0.5gms)", unit: "Pcs", category: "General", purchase_rate: 290, selling_price: 1000 },
    { name: "Saghu Dana", unit: "Kgs", category: "General", purchase_rate: 300, selling_price: 800 },
    { name: "Silli Betel Nut", unit: "Kgs", category: "General", purchase_rate: 3200, selling_price: 4000 },
    { name: "Silver Ball", unit: "Kgs", category: "General", purchase_rate: 380, selling_price: 800 },
    { name: "Silver Warq (5)", unit: "Pcs", category: "General", purchase_rate: 12.5, selling_price: 100 },
    { name: "Siwayyan", unit: "Pcs", category: "General", purchase_rate: 38.33, selling_price: 80 },
    { name: "Sliced Betel Nut", unit: "Kgs", category: "General", purchase_rate: 1400, selling_price: 4000 },
    { name: "Star & Polo Mix", unit: "Kgs", category: "General", purchase_rate: 300, selling_price: 800 },
    { name: "Sunflower seeds", unit: "Kgs", category: "General", purchase_rate: 360, selling_price: 480 },
    { name: "Sunflower Seeds (Roasted)", unit: "Kgs", category: "General", purchase_rate: 550, selling_price: 1400 },
    { name: "Sunflower Seeds W/O Shell", unit: "Kgs", category: "General", purchase_rate: 800, selling_price: 3600 },
    { name: "Sunny Betel Nut", unit: "Kgs", category: "General", purchase_rate: 3200, selling_price: 4000 },
    { name: "Sweet Paan Masala", unit: "Kgs", category: "General", purchase_rate: 700, selling_price: 1400 },
    { name: "Sweet Soda Powder", unit: "Kgs", category: "General", purchase_rate: 140, selling_price: 400 },
    { name: "Vanilla Essence", unit: "Pcs", category: "General", purchase_rate: 50, selling_price: 80 },
    { name: "Zafrani Essence", unit: "Pcs", category: "General", purchase_rate: 50, selling_price: 80 },
    { name: "Zafrani Kewra (300 ml)", unit: "Pcs", category: "General", purchase_rate: 75, selling_price: 120 },
    { name: "Zarda food colour", unit: "Kgs", category: "General", purchase_rate: 560, selling_price: 1600 },
    { name: "Key Synthetic Vinegar (750 ml)", unit: "Pcs", category: "General", purchase_rate: 110, selling_price: 190 },
    { name: "Saffron ( 1 gm ) dibya", unit: "Kgs", category: "General", purchase_rate: 300, selling_price: 1400 },
    { name: "Key Synthetic Vinegar (300 ml)", unit: "Pcs", category: "General", purchase_rate: 70, selling_price: 120 },
    { name: "Green Cardamom (whole) (Eliche) ( AKBER )", unit: "Kgs", category: "General", purchase_rate: 14000, selling_price: 20000 },
    { name: "Fried Onion ( 500 GM )", unit: "Pcs", category: "General", purchase_rate: "Default", selling_price: 285 },
    { name: "Ginger Gurr", unit: "Kgs", category: "General", purchase_rate: "Default", selling_price: 450 },
    { name: "CHANNA CHIKKI 250 GM", unit: "Kgs", category: "General", purchase_rate: "Default", selling_price: 0 },
    { name: "Murmuray Chikki", unit: "Pcs", category: "General", purchase_rate: "Default", selling_price: 0 },
    { name: "Empty Murabba bottles", unit: "Pcs", category: "General", purchase_rate: "Default", selling_price: 37.5 },
    { name: "EMPTY FOOD COLOR DIBYA", unit: "Pcs", category: "General", purchase_rate: "Default", selling_price: 4.44 },
    { name: "Shilajit .10 gm", unit: "Pcs", category: "General", purchase_rate: "Default", selling_price: 466.96 },
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

