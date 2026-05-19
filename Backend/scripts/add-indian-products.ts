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
    { name: "Axe Brand Abu Fass", unit: "Pcs", category: "Indian Products", purchase_rate: 180, selling_price: 300 },
    { name: "B-Tex Balm", unit: "Pcs", category: "Indian Products", purchase_rate: 220, selling_price: 380 },
    { name: "Baba Elaichi (10 gms)", unit: "Pcs", category: "Indian Products", purchase_rate: 550, selling_price: 850 },
    { name: "Budhia Surma", unit: "Pcs", category: "Indian Products", purchase_rate: 80, selling_price: 150 },
    { name: "Chandrika Soap", unit: "Pcs", category: "Indian Products", purchase_rate: 400, selling_price: 650 },
    { name: "Crack Cream", unit: "Pcs", category: "Indian Products", purchase_rate: 220, selling_price: 480 },
    { name: "Dabur Red Toothpaste (L)", unit: "Pcs", category: "Indian Products", purchase_rate: 550, selling_price: 800 },
    { name: "Hajmola", unit: "Pcs", category: "Indian Products", purchase_rate: 750, selling_price: 1200 },
    { name: "Hawaban Tablet", unit: "Pcs", category: "Indian Products", purchase_rate: 180, selling_price: 400 },
    { name: "Indulekha Oil (100 ml)", unit: "Pcs", category: "Indian Products", purchase_rate: 800, selling_price: 1600 },
    { name: "Iodex", unit: "Pcs", category: "Indian Products", purchase_rate: 280, selling_price: 480 },
    { name: "Itch Guard", unit: "Pcs", category: "Indian Products", purchase_rate: 250, selling_price: 450 },
    { name: "Jivan Mixture (60 ml)", unit: "Pcs", category: "Indian Products", purchase_rate: 450, selling_price: 900 },
    { name: "Kajal", unit: "Pcs", category: "Indian Products", purchase_rate: 90, selling_price: 150 },
    { name: "Kayam Churna", unit: "Pcs", category: "Indian Products", purchase_rate: 600, selling_price: 950 },
    { name: "Kayam Tablet", unit: "Pcs", category: "Indian Products", purchase_rate: 450, selling_price: 800 },
    { name: "Lookman e Hayat Oil (100 ml)", unit: "Pcs", category: "Indian Products", purchase_rate: 550, selling_price: 850 },
    { name: "Moov Cream", unit: "Pcs", category: "Indian Products", purchase_rate: 270, selling_price: 450 },
    { name: "Mysore Sandal Soap Large", unit: "Pcs", category: "Indian Products", purchase_rate: 650, selling_price: 900 },
    { name: "Navratna Oil (200 ml)", unit: "Pcs", category: "Indian Products", purchase_rate: 500, selling_price: 950 },
    { name: "Nurament Oil (50 ml)", unit: "Pcs", category: "Indian Products", purchase_rate: 400, selling_price: 750 },
    { name: "Parachute Oil (100 ml)", unit: "Pcs", category: "Indian Products", purchase_rate: 450, selling_price: 700 },
    { name: "Pudin Hara Drops", unit: "Pcs", category: "Indian Products", purchase_rate: 380, selling_price: 600 },
    { name: "Pudin Hara Tablets", unit: "Pcs", category: "Indian Products", purchase_rate: 260, selling_price: 350 },
    { name: "Rajnigandha Silver Pearls", unit: "Pcs", category: "Indian Products", purchase_rate: 600, selling_price: 950 },
    { name: "Sandal Soap No. 1", unit: "Pcs", category: "Indian Products", purchase_rate: 300, selling_price: 480 },
    { name: "Sudarshan Churan (30 gm)", unit: "Pcs", category: "Indian Products", purchase_rate: 350, selling_price: 600 },
    { name: "Tiger Balm Red", unit: "Pcs", category: "Indian Products", purchase_rate: 550, selling_price: 850 },
    { name: "Tiger Balm White", unit: "Pcs", category: "Indian Products", purchase_rate: 550, selling_price: 850 },
    { name: "Vicco Manjan (50 gms)", unit: "Pcs", category: "Indian Products", purchase_rate: 380, selling_price: 600 },
    { name: "Vicco Turmeric (m)", unit: "Pcs", category: "Indian Products", purchase_rate: 400, selling_price: 650 },
    { name: "Zandu Ultra Power", unit: "Pcs", category: "Indian Products", purchase_rate: 400, selling_price: 650 },
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

