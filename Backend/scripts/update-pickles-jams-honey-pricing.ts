import { prisma } from '../src/prisma/client';
import { ProductService } from '../src/services/product.service';

const productService = new ProductService();

// Pickles, Jams & Honey products data
const picklesJamsHoneyProducts = [
    { name: 'Amla Murabba (500 gms)', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 400, sellingPrice: 550 },
    { name: 'Amla Murabba KG', unit: 'Kgs', category: 'Pickles, Jams & Honey', purchaseRate: 800, sellingPrice: 1100 },
    { name: 'Apple Murabba (500 gms)', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 400, sellingPrice: 550 },
    { name: 'Ashrafi Murabba', unit: 'Kgs', category: 'Pickles, Jams & Honey', purchaseRate: 360, sellingPrice: 750 },
    { name: 'Bahi Murabba (500 gms)', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 450, sellingPrice: 550 },
    { name: 'Bahi Murabba KG', unit: 'Kgs', category: 'Pickles, Jams & Honey', purchaseRate: 900, sellingPrice: 1100 },
    { name: 'Bailgiri Murabba (500 gms)', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 500, sellingPrice: 650 },
    { name: 'Carrot Pickle', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 175, sellingPrice: 240 },
    { name: 'Carrot Pickle Vinegar', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 105, sellingPrice: 280 },
    { name: 'Dhoop Lemon (Vinegar)', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 175, sellingPrice: 400 },
    { name: 'Garlic (Lehsan) Pickle', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 270, sellingPrice: 460 },
    { name: 'Garlic (Lehsan) Pickle (vinegar)', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 245, sellingPrice: 400 },
    { name: 'Green Chatni', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 175, sellingPrice: 240 },
    { name: 'Green Chilli (Hari Mirch Long) Vinegar', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 175, sellingPrice: 320 },
    { name: 'Green Chilli (Hari Mirch) Pickle', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 300, sellingPrice: 240 },
    { name: 'Green Chilli (Vinegar)', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 175, sellingPrice: 260 },
    { name: 'Gulqand Murabba', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 80, sellingPrice: 180 },
    { name: 'Harr Ka Murabba', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 450, sellingPrice: 550 },
    { name: 'Honey (Barry)', unit: 'Kgs', category: 'Pickles, Jams & Honey', purchaseRate: 1000, sellingPrice: 3600 },
    { name: 'Honey (Paloosa)', unit: 'Kgs', category: 'Pickles, Jams & Honey', purchaseRate: 1000, sellingPrice: 1800 },
    { name: 'Kakronde Murabba', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 100, sellingPrice: 220 },
    { name: 'Kasondi Pickle', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 160, sellingPrice: 240 },
    { name: 'Lasorah Pickle', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 175, sellingPrice: 240 },
    { name: 'Lemon Pickle', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 175, sellingPrice: 240 },
    { name: 'Mango Pickle', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 175, sellingPrice: 240 },
    { name: 'Mixed Pickle 250 GM', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 160, sellingPrice: 240 },
    { name: 'Mixed Pickle 500 GM', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 300, sellingPrice: 650 },
    { name: 'Mixed Sabzi (Vinegar)', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 175, sellingPrice: 350 },
    { name: 'Orange Peel Murabba', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 110, sellingPrice: 180 },
    { name: 'Prunes Chatni', unit: 'Pcs', category: 'Pickles, Jams & Honey', purchaseRate: 270, sellingPrice: 600 },
];

async function updatePicklesJamsHoneyPricing() {
    try {
        console.log(`📋 Processing ${picklesJamsHoneyProducts.length} Pickles, Jams & Honey products\n`);

        const results = [];
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < picklesJamsHoneyProducts.length; i++) {
            const prod = picklesJamsHoneyProducts[i];
            
            try {
                // Skip products with 0 selling price (they need manual pricing)
                if (prod.sellingPrice === 0) {
                    console.log(`\n[${i + 1}/${picklesJamsHoneyProducts.length}] ⚠️  Skipping: ${prod.name} (Selling Price is 0)`);
                    skippedCount++;
                    results.push({ 
                        success: false, 
                        skipped: true,
                        reason: 'Selling price is 0',
                        name: prod.name
                    });
                    continue;
                }

                const enhancedProd = {
                    name: prod.name,
                    purchase_rate: Number(prod.purchaseRate) || 0,
                    sales_rate_exc_dis_and_tax: Number(prod.sellingPrice) || 0,
                    sales_rate_inc_dis_and_tax: Number(prod.sellingPrice) || 0,
                    min_qty: 10,
                    max_qty: 10,
                    is_active: true,
                    display_on_pos: true,
                    is_batch: false,
                    auto_fill_on_demand_sheet: false,
                    non_inventory_item: false,
                    is_deal: false,
                    is_featured: false,
                    description: '',
                    pct_or_hs_code: '',
                    sku: '', // Empty SKU - will use existing or generate new
                    discount_amount: 0,
                    unit_name: prod.unit,
                    category_name: prod.category,
                    subcategory_name: '',
                    tax_name: '',
                    supplier_name: '',
                    brand_name: '',
                    color_name: '',
                    size_name: '',
                };

                // Validate required fields
                if (!enhancedProd.name) {
                    throw new Error('Missing required field: name');
                }
                
                if (!enhancedProd.sales_rate_exc_dis_and_tax) {
                    throw new Error('Missing required field: selling price');
                }

                console.log(`\n[${i + 1}/${picklesJamsHoneyProducts.length}] Processing: ${enhancedProd.name}`);
                console.log(`   Unit: ${enhancedProd.unit_name} | Category: ${enhancedProd.category_name}`);
                console.log(`   Purchase Rate: ${enhancedProd.purchase_rate}`);
                console.log(`   Selling Price: ${enhancedProd.sales_rate_exc_dis_and_tax}`);

                const result = await productService.createProductFromBulkUpload(enhancedProd);
                
                results.push({ 
                    success: true, 
                    id: result.id, 
                    name: result.name,
                    unit: result.unit?.name || 'Unknown',
                    category: result.category?.name || 'Unknown'
                });
                
                successCount++;
                console.log(`   ✅ Success - ${result.id}`);
            } catch (err: any) {
                errorCount++;
                const errorMsg = err.message || 'Unknown error';
                console.log(`   ❌ Error: ${errorMsg}`);
                results.push({ 
                    success: false, 
                    error: errorMsg, 
                    data: prod 
                });
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successful: ${successCount}`);
        console.log(`⚠️  Skipped (0 price): ${skippedCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        console.log(`📦 Total: ${picklesJamsHoneyProducts.length}`);
        console.log('='.repeat(60));

        // Save results to file
        const resultsPath = require('path').join(__dirname, '../../pickles-jams-honey-update-results.json');
        require('fs').writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        console.log(`\n💾 Results saved to: ${resultsPath}`);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
updatePicklesJamsHoneyPricing()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });


