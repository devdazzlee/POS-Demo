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
    { name: "Hemani Argan Oil (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 410, selling_price: 680 },
    { name: "Hemani Avocado Oil", unit: "Pcs", category: "Essential Oils & Shampoo", selling_price: 680 },
    { name: "Hemani JoJoba Oil (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 330, selling_price: 680 },
    { name: "Hemani Orange Oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 390, selling_price: 650 },
    { name: "Hemani Rosehip Oil", unit: "Pcs", category: "Essential Oils & Shampoo", selling_price: 740 },
    { name: "Hemani Shifa Oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 500, selling_price: 850 },
    { name: "Hemani Vitamin E Oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 370, selling_price: 680 },
    { name: "HP Ajwain Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 370, selling_price: 550 },
    { name: "HP Ajwain Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 190, selling_price: 450 },
    { name: "HP Aloe Vera Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 80, selling_price: 200 },
    { name: "HP Aloe Vera Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 160, selling_price: 350 },
    { name: "HP Amla Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
    { name: "HP Amla Oil (60ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 440 },
    { name: "HP Amla Reetha Sikakai Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 440 },
    { name: "HP Balsan Oil (1gm)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 550, selling_price: 1400 },
    { name: "HP Banafsha Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 170, selling_price: 340 },
    { name: "HP Banafsha Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 330, selling_price: 680 },
    { name: "HP Bitter Almond Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 450 },
    { name: "HP Bitter Almond Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 370, selling_price: 650 },
    { name: "HP Bitter Mustard Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 120, selling_price: 240 },
    { name: "HP Bitter Mustard Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 280, selling_price: 480 },
    { name: "HP Black Sesame oil (120 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 350, selling_price: 750 },
    { name: "HP Chamomile Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
    { name: "HP Chamomile Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 230, selling_price: 480 },
    { name: "HP Castor Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 80, selling_price: 120 },
    { name: "HP Castor Oil (60ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 120, selling_price: 240 },
    { name: "HP Cinnamon Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 120, selling_price: 240 },
    { name: "HP Clove Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 340 },
    { name: "HP Coriander Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 410, selling_price: 640 },
    { name: "HP Coriander Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
    { name: "HP Egg Oil (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 160, selling_price: 380 },
    { name: "HP Egg Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 320, selling_price: 740 },
    { name: "HP Eucalyptus Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 100, selling_price: 240 },
    { name: "HP Euclyptus Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 210, selling_price: 480 },
    { name: "HP Fennel Seeds Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 170, selling_price: 380 },
    { name: "HP Fennel Seeds Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 310, selling_price: 580 },
    { name: "HP Fenugreek Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
    { name: "HP Fenugreek Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 210, selling_price: 480 },
    { name: "HP Fish Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 120, selling_price: 300 },
    { name: "HP Fish Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 240, selling_price: 600 },
    { name: "HP Flax Seed Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 100, selling_price: 240 },
    { name: "HP Flax Seed Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 70, selling_price: 120 },
    { name: "HP Garlic Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 90, selling_price: 240 },
    { name: "HP Ginger Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 90, selling_price: 240 },
    { name: "HP Glycerine Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 120, selling_price: 240 },
    { name: "HP Jasmine Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
    { name: "HP Jasmine Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 230, selling_price: 480 },
    { name: "HP Jojoba Oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 280, selling_price: 680 },
    { name: "HP Kahu Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
    { name: "HP Kahu Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 480 },
    { name: "HP Kalonji Oil (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 210, selling_price: 340 },
    { name: "HP Kalonji Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 320, selling_price: 480 },
    { name: "HP Khashkhash Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 100, selling_price: 240 },
    { name: "HP Khashkhash Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 210, selling_price: 480 },
    { name: "HP Lavender Oil (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 170, selling_price: 240 },
    { name: "HP Lavender Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 320, selling_price: 480 },
    { name: "HP Lemon Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 350, selling_price: 600 },
    { name: "HP Maalkangni Oil ( 30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 450, selling_price: 800 },
    { name: "HP Maalkangni Oil ( 60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 430, selling_price: 800 },
    { name: "HP Mixed Melon Seed Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 170, selling_price: 240 },
    { name: "HP Mixed Melon seed Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 320, selling_price: 480 },
    { name: "HP Nabatati Oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 350, selling_price: 600 },
    { name: "HP Nabatati Talah Oil (10 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 700, selling_price: 1350 },
    { name: "HP Nagarmotha Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 90, selling_price: 240 },
    { name: "HP Nagarmotha Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 190, selling_price: 480 },
    { name: "HP Neem Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 190, selling_price: 300 },
    { name: "HP Neem Oil (60ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 360, selling_price: 600 },
    { name: "HP Nutmeg Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 160, selling_price: 300 },
    { name: "HP Olive Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 80, selling_price: 170 },
    { name: "HP Olive oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 170, selling_price: 340 },
    { name: "HP Orange Oil (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 320, selling_price: 650 },
    { name: "HP Peanut Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 170, selling_price: 300 },
    { name: "HP Peanut Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 350, selling_price: 600 },
    { name: "HP Peppermint Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 140, selling_price: 350 },
    { name: "HP Peppermint Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 280, selling_price: 700 },
    { name: "HP Pistachio Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 500, selling_price: 880 },
    { name: "HP Pistachio Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 750, selling_price: 1350 },
    { name: "HP Pumpkin Seed oil (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 350 },
    { name: "HP Pumpkin Seed oil (60ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 350, selling_price: 650 },
    { name: "HP Reetha Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
    { name: "HP Reetha Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 220 },
    { name: "HP Rose Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo" },
    { name: "HP Rose Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 170, selling_price: 480 },
    { name: "HP Rosemary Oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 500, selling_price: 800 },
    { name: "HP Sandal Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 180, selling_price: 340 },
    { name: "HP Sandal Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 360, selling_price: 680 },
    { name: "HP Sikakai Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 70, selling_price: 120 },
    { name: "HP Sikakai Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 440 },
    { name: "HP Staff Tree Seed Oil (10 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 480 },
    { name: "HP Sweet Almond OIl (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 350 },
    { name: "HP Sweet Almond Oil (60ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 370, selling_price: 550 },
    { name: "HP Tea Tree Oil (10 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 210, selling_price: 400 },
    { name: "HP Tea Tree Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 400, selling_price: 800 },
    { name: "HP Ushna Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 320, selling_price: 550 },
    { name: "HP Walnut Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 210, selling_price: 480 },
    { name: "HP Walnut Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 430, selling_price: 960 },
    { name: "HP Wheat Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
    { name: "MP Cinnamon Oil (60ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 230, selling_price: 480 },
    { name: "Mp Coconut Oil (1 Kg)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 1200, selling_price: 1800 },
    { name: "MP Coconut Oil (125 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 160, selling_price: 320 },
    { name: "Mp Coconut Oil (250 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 300, selling_price: 550 },
    { name: "Mp Coconut Oil (500 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 600, selling_price: 900 },
    { name: "MP Hair oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 290, selling_price: 550 },
    { name: "MP Hair Shampoo", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 290, selling_price: 550 },
    { name: "MP Mustard seed Oil (1 kg)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 560, selling_price: 1200 },
    { name: "MP Mustard Seed Oil (2 kg)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 560, selling_price: 2400 },
    { name: "MP Mustard Seed Oil (125 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 130, selling_price: 220 },
    { name: "MP Mustard Seed Oil (250 ml)", unit: "Pcs", category: "Essential Oils & Shampoo" },
    { name: "Mp Mustard Seed Oil (500 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 600, selling_price: 600 },
    { name: "MP Onion Oil 120 (ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 550, selling_price: 800 },
    { name: "MP Pudina Oil 60 (ml)", unit: "Pcs", category: "Essential Oils & Shampoo" },
    { name: "MP Rosemary Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 720, selling_price: 1400 },
    { name: "MP Sesame Seed Oil (125 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 160, selling_price: 300 },
    { name: "MP Sesame Seed Oil (250 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 600, selling_price: 600 },
    { name: "MP Sesame Seed Oil (1 Kg)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 900, selling_price: 2400 },
    { name: "MP Sesame Seeds Oil (500 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", selling_price: 1200 },
    { name: "MP Tarpeen Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo" },
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

