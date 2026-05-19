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
    { name: "AB Icecream Soda", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
    { name: "AB Pineapple Sharbat", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
    { name: "Ab Sharbat e Anaar", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
    { name: "AB Sharbat e Blueberry", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
    { name: "AB Sharbat e Gulab", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
    { name: "AB Sharbat e Lychee", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
    { name: "AB Sharbat e Mango", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
    { name: "AB Sharbat e Orange", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
    { name: "AB Sharbat e Peach", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
    { name: "AB Sharbat e Sandal", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
    { name: "AQ Arq Dasmol", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 220, selling_price: 340 },
    { name: "AQ Arq e Ajwain", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 160, selling_price: 240 },
    { name: "AQ Arq e Badian", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 160, selling_price: 240 },
    { name: "AQ Arq e Gaozban", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 160, selling_price: 240 },
    { name: "AQ Arq e Gulab", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 120, selling_price: 250 },
    { name: "AQ Arq e Gulab Spray", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 100, selling_price: 150 },
    { name: "AQ Arq e Kasni", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 160, selling_price: 240 },
    { name: "AQ Arq e Makoh", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 160, selling_price: 240 },
    { name: "AQ Arq Mehzal", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 220, selling_price: 450 },
    { name: "AQ Arq Poudina", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 160, selling_price: 240 },
    { name: "AQ Chaw Arqa", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 160, selling_price: 240 },
    { name: "AQ Jam e Shifa (250ml)", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 150, selling_price: 300 },
    { name: "AQ Jam e Shifa (800ml)", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 450, selling_price: 700 },
    { name: "AQ Sharbat e Anjbar", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 250, selling_price: 350 },
    { name: "AQ Sharbat e Badam", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 280, selling_price: 480 },
    { name: "AQ Sharbat e Elaichi", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 250, selling_price: 350 },
    { name: "AQ Sharbat e Unaab", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 250, selling_price: 440 },
    { name: "AQ Sharbat Pomegranate (Anar)", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 320, selling_price: 470 },
    { name: "AQ Sharbat Sandal", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 320, selling_price: 490 },
    { name: "AQ Sharbat Tamarind & Prunes", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 320, selling_price: 440 },
    { name: "Aqua Slim", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 0, selling_price: 0 },
    { name: "Arq e Makoh (Marhaba)", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 0, selling_price: 0 },
    { name: "Arq Nana", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 66.67, selling_price: 200 },
    { name: "Dittus Apple Vinegar", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 480, selling_price: 550 },
    { name: "Dittus Grape Vinegar", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 480, selling_price: 550 },
    { name: "Jaman Vinegar", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 280, selling_price: 400 },
    { name: "MP Arq Gulab ( 800 ml )", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 63, selling_price: 250 },
    { name: "Rooh Kewra ( 800 ML )", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 100, selling_price: 250 },
    { name: "Rooh Kewra 300 ml", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: "Default", selling_price: 120 },
    { name: "Sharbat E Bazoori", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 320, selling_price: 490 },
    { name: "Sharbat e Roohafza (Hamdard)", unit: "Pcs", category: "Arqiat & Juices" },
    { name: "Thadal", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 550, selling_price: 600 },
    { name: "Zafrani Kewra ( 800 ML )", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 100, selling_price: 250 },
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
            // Handle products with 0, missing, or "Default" prices
            let purchaseRate: number;
            let sellingPrice: number;

            // Parse selling price
            if (product.selling_price === undefined || product.selling_price === null || product.selling_price === 0) {
                sellingPrice = 150; // Default
            } else if (typeof product.selling_price === 'string') {
                sellingPrice = parseFloat(product.selling_price) || 150;
            } else {
                sellingPrice = product.selling_price;
            }

            // Parse purchase rate
            if (product.purchase_rate === undefined || product.purchase_rate === null || product.purchase_rate === 0) {
                purchaseRate = sellingPrice > 0 ? Math.round(sellingPrice * 0.7) : 100;
            } else if (product.purchase_rate === "Default" || (typeof product.purchase_rate === 'string' && product.purchase_rate.toLowerCase() === 'default')) {
                purchaseRate = sellingPrice > 0 ? Math.round(sellingPrice * 0.7) : 100;
            } else if (typeof product.purchase_rate === 'string') {
                purchaseRate = parseFloat(product.purchase_rate) || (sellingPrice > 0 ? Math.round(sellingPrice * 0.7) : 100);
            } else {
                purchaseRate = product.purchase_rate;
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

