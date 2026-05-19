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
    { name: "Achar Gosht Masalah", unit: "Kgs", category: "Spices", purchase_rate: 800, selling_price: 2400 },
    { name: "Achar Masalah", unit: "Kgs", category: "Spices", purchase_rate: 800, selling_price: 2400 },
    { name: "BBQ Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
    { name: "Bihari Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
    { name: "Biryani Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
    { name: "Black Cardamom (Bari Elaichi)", unit: "Kgs", category: "Spices", purchase_rate: 8000, selling_price: 11000 },
    { name: "Black Cumin (Kaala Zeera)", unit: "Kgs", category: "Spices", purchase_rate: 1320, selling_price: 1800 },
    { name: "Black Pepper (Kaali Mirch)", unit: "Kgs", category: "Spices", purchase_rate: 1200, selling_price: 3600 },
    { name: "Black Pepper Powder (Kaali Mirch)", unit: "Kgs", category: "Spices", purchase_rate: 1280, selling_price: 3800 },
    { name: "Black Prunes (Kandhari)", unit: "Kgs", category: "Spices", purchase_rate: 920, selling_price: 1800 },
    { name: "Black Salt Grounded", unit: "Kgs", category: "Spices", purchase_rate: 80, selling_price: 800 },
    { name: "Black Seeds (Kalonji)", unit: "Kgs", category: "Spices", purchase_rate: 840, selling_price: 1800 },
    { name: "Black Seeds Powder (Kalonji)", unit: "Kgs", category: "Spices", purchase_rate: 900, selling_price: 2400 },
    { name: "Carom Seeds (Ajwain)", unit: "Kgs", category: "Spices", purchase_rate: 360, selling_price: 800 },
    { name: "Carom Seeds Powder (Ajwain)", unit: "Kgs", category: "Spices", purchase_rate: 380, selling_price: 1200 },
    { name: "Chat Masalah", unit: "Kgs", category: "Spices", purchase_rate: 400, selling_price: 1200 },
    { name: "Chicken Powder", unit: "Kgs", category: "Spices", purchase_rate: 480, selling_price: 1000 },
    { name: "Chinese Salt", unit: "Kgs", category: "Spices", purchase_rate: 800, selling_price: 2400 },
    { name: "Cinnamon Ceylon (Round)", unit: "Kgs", category: "Spices", purchase_rate: 2000, selling_price: 4400 },
    { name: "Cinnamon- Cassia", unit: "Kgs", category: "Spices", purchase_rate: 900, selling_price: 2000 },
    { name: "Cinnamon- Cassia Powder", unit: "Kgs", category: "Spices", purchase_rate: 1000, selling_price: 2400 },
    { name: "Citric Acid (Tatri)", unit: "Kgs", category: "Spices", purchase_rate: 320, selling_price: 1200 },
    { name: "Cloves (Long)", unit: "Kgs", category: "Spices", purchase_rate: 2900, selling_price: 5600 },
    { name: "Cloves Powder (Long)", unit: "Kgs", category: "Spices", purchase_rate: 3600, selling_price: 6000 },
    { name: "Coriander Seeds (Sabut Dhanya)", unit: "Kgs", category: "Spices", purchase_rate: 480, selling_price: 1200 },
    { name: "Coriander Seeds Powder (Pisa Dhanya)", unit: "Kgs", category: "Spices", purchase_rate: 500, selling_price: 1400 },
    { name: "Crushed Coriander (Kuta Dhanya)", unit: "Kgs", category: "Spices", purchase_rate: 500, selling_price: 1400 },
    { name: "Crushed Fenugreek Seeds (Kuta Methi Dana)", unit: "Kgs", category: "Spices", purchase_rate: 320, selling_price: 1000 },
    { name: "Crushed Red Chilli", unit: "Kgs", category: "Spices", purchase_rate: 650, selling_price: 1800 },
    { name: "Curry Leaves Powder", unit: "Kgs", category: "Spices", purchase_rate: 0, selling_price: 0 },
    { name: "Dahi Barra Masalah", unit: "Kgs", category: "Spices", purchase_rate: 680, selling_price: 1800 },
    { name: "Dried Ginger Grounded (Sonth)", unit: "Kgs", category: "Spices", purchase_rate: 1280, selling_price: 2800 },
    { name: "Fennel Seeds", unit: "Kgs", category: "Spices", purchase_rate: 680, selling_price: 1600 },
    { name: "Fennel Seeds Powder", unit: "Kgs", category: "Spices", purchase_rate: 560, selling_price: 2400 },
    { name: "Fenugreek Seeds (Methi Daana)", unit: "Kgs", category: "Spices", purchase_rate: 240, selling_price: 800 },
    { name: "Fish Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
    { name: "Garam Masalah Mix (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 2400, selling_price: 4800 },
    { name: "Garam Masalah Powder", unit: "Kgs", category: "Spices", purchase_rate: 1800, selling_price: 5600 },
    { name: "Garlic (Lehsan) Powder", unit: "Kgs", category: "Spices", purchase_rate: 1040, selling_price: 1400 },
    { name: "General Masalah", unit: "Kgs", category: "Spices", purchase_rate: 960, selling_price: 2400 },
    { name: "Golden Prunes", unit: "Kgs", category: "Spices", purchase_rate: 560, selling_price: 1800 },
    { name: "Green Cardamom (Elaichi)", unit: "Kgs", category: "Spices", purchase_rate: 10800, selling_price: 20000 },
    { name: "Green Cardamom Powder (Elaichi)", unit: "Kgs", category: "Spices", purchase_rate: 9600, selling_price: 15000 },
    { name: "Kabab Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
    { name: "Kachri (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 500, selling_price: 1200 },
    { name: "Kachri Powder", unit: "Kgs", category: "Spices", purchase_rate: 650, selling_price: 1400 },
    { name: "Kaleji Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
    { name: "Karahi Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
    { name: "Kasuri Methi", unit: "Kgs", category: "Spices", purchase_rate: 240, selling_price: 1000 },
    { name: "Khashkhash", unit: "Kgs", category: "Spices", purchase_rate: 800, selling_price: 1600 },
    { name: "Khatai (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 140, selling_price: 1200 },
    { name: "Khatai Powder", unit: "Kgs", category: "Spices", purchase_rate: 280, selling_price: 1400 },
    { name: "Lahori Salt (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 30, selling_price: 100 },
    { name: "Lahori Salt Powder", unit: "Kgs", category: "Spices", purchase_rate: 30, selling_price: 100 },
    { name: "Mace (Javitri)", unit: "Kgs", category: "Spices", purchase_rate: 7600, selling_price: 9600 },
    { name: "Mace Powder (Javitri-Box)", unit: "Pcs", category: "Spices", purchase_rate: 25, selling_price: 16000 },
    { name: "Mace Powder (Javitri)", unit: "Kgs", category: "Spices", purchase_rate: 6700, selling_price: 0 },
    { name: "Marwari Mirch", unit: "Kgs", category: "Spices", purchase_rate: 750, selling_price: 1200 },
    { name: "Mixed Red Chilli Powder", unit: "Kgs", category: "Spices", purchase_rate: 900, selling_price: 1800 },
    { name: "Mixed Salan Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
    { name: "Mustard Seeds", unit: "Kgs", category: "Spices", purchase_rate: 280, selling_price: 800 },
    { name: "Mustard Seeds Powder", unit: "Kgs", category: "Spices", purchase_rate: 480, selling_price: 1000 },
    { name: "National Salt", unit: "Kgs", category: "Spices", purchase_rate: 58, selling_price: 100 },
    { name: "Nihari Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
    { name: "Nutmeg (Jaifal)", unit: "Kgs", category: "Spices", purchase_rate: 1800, selling_price: 6000 },
    { name: "Nutmeg powder (Jaifal-Box)", unit: "Pcs", category: "Spices", purchase_rate: 2900, selling_price: 16000 },
    { name: "Nutmeg Powder (Jaifal)", unit: "Kgs", category: "Spices", purchase_rate: 4100, selling_price: 0 },
    { name: "Pakora Mix", unit: "Kgs", category: "Spices", purchase_rate: 560, selling_price: 1800 },
    { name: "Paprika (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 1050, selling_price: 4000 },
    { name: "Paprika Powder", unit: "Kgs", category: "Spices", purchase_rate: 1000, selling_price: 2400 },
    { name: "Patna Red Chilli", unit: "Kgs", category: "Spices", purchase_rate: 700, selling_price: 1600 },
    { name: "Paya Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
    { name: "Persian Cumin (Special Zeera)", unit: "Kgs", category: "Spices", purchase_rate: 2800, selling_price: 4000 },
    { name: "Pink Salt", unit: "Kgs", category: "Spices", purchase_rate: 30, selling_price: 100 },
    { name: "Pipliyan", unit: "Kgs", category: "Spices", purchase_rate: 3200, selling_price: 4800 },
    { name: "Pomegranate (Anaar) Seeds", unit: "Kgs", category: "Spices", purchase_rate: 500, selling_price: 1800 },
    { name: "Pomegranate (Anaar) seeds Powder", unit: "Kgs", category: "Spices", purchase_rate: 540, selling_price: 2400 },
    { name: "Pulao Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
    { name: "Qorma Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
    { name: "Round Red Chilli (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 1050, selling_price: 1600 },
    { name: "Round Red Chilli Powder", unit: "Kgs", category: "Spices", purchase_rate: 750, selling_price: 1800 },
    { name: "Seekh Kabab Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
    { name: "Silver Coated Cardamom (Elaichi)", unit: "Kgs", category: "Spices", purchase_rate: 6000, selling_price: 20000 },
    { name: "Star Anise (Badian K Phool)", unit: "Kgs", category: "Spices", purchase_rate: 1280, selling_price: 4800 },
    { name: "Tamarind", unit: "Kgs", category: "Spices", purchase_rate: 340, selling_price: 700 },
    { name: "Tikka Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
    { name: "Tukhm e Balanga", unit: "Kgs", category: "Spices", purchase_rate: 1000, selling_price: 2800 },
    { name: "Turmeric (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 750, selling_price: 1600 },
    { name: "Turmeric Powder", unit: "Kgs", category: "Spices", purchase_rate: 650, selling_price: 1800 },
    { name: "White Cumin (Safaid Zeera)", unit: "Kgs", category: "Spices", purchase_rate: 1600, selling_price: 3600 },
    { name: "White Cumin Powder (Zeera Powder)", unit: "Kgs", category: "Spices", purchase_rate: 1200, selling_price: 3800 },
    { name: "White Pepper (Grounded)", unit: "Kgs", category: "Spices", purchase_rate: 3400, selling_price: 5200 },
    { name: "White Pepper (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 2300, selling_price: 4800 },
    { name: "White Sesame seed (Safaid Til)", unit: "Kgs", category: "Spices", purchase_rate: 560, selling_price: 1800 },
    { name: "Whole Dried Ginger (Sonth)", unit: "Kgs", category: "Spices", purchase_rate: 1200, selling_price: 2400 },
    { name: "Yellow Mustard", unit: "Kgs", category: "Spices", purchase_rate: 400, selling_price: 1600 },
    { name: "Bay leaf (Tez Patta)", unit: "Kgs", category: "Spices", purchase_rate: 720, selling_price: 1500 },
    { name: "Green Cardamom Seeds", unit: "Kgs", category: "Herbs", purchase_rate: 10000, selling_price: 20000 },
    { name: "Black Cardamom Seeds", unit: "Kgs", category: "Herbs", purchase_rate: 8000, selling_price: 16000 },
    { name: "Black Sesame seeds (Kaala Til)", unit: "Kgs", category: "Herbs", purchase_rate: 750, selling_price: 1600 },
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

