import { prisma } from '../src/prisma/client';
import { ProductService } from '../src/services/product.service';

const productService = new ProductService();

// Grains, Pulses & Rice products data
const grainsPulsesRiceProducts = [
    { name: 'Anmol Rice', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 0, sellingPrice: 0 },
    { name: 'Barley (Jaww)', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 200, sellingPrice: 320 },
    { name: 'Black Chickpeas (Kaala Chana)', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 280, sellingPrice: 500 },
    { name: 'Daal Arhar', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 640, sellingPrice: 880 },
    { name: 'Daal Haleem Mix', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 250, sellingPrice: 600 },
    { name: 'Daal Maash', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 470, sellingPrice: 680 },
    { name: 'Daal Maash Chilka', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 440, sellingPrice: 560 },
    { name: 'Daal Maash Sabut', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 420, sellingPrice: 680 },
    { name: 'Daal Mix', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 250, sellingPrice: 600 },
    { name: 'Daal Moong', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 405, sellingPrice: 480 },
    { name: 'Daal Moong Chilka', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 380, sellingPrice: 480 },
    { name: 'Daal Moong Sabut', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 400, sellingPrice: 480 },
    { name: 'Gandum Daliya Bareeq', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 180, sellingPrice: 320 },
    { name: 'Gandum Daliya Mota', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 180, sellingPrice: 320 },
    { name: 'Jasmine Rice', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 0, sellingPrice: 0 },
    { name: 'Jaww Ka Daliya', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 230, sellingPrice: 400 },
    { name: 'Kaali Masoor', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 270, sellingPrice: 480 },
    { name: 'Kangni', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 250, sellingPrice: 340 },
    { name: 'Kidney Beans (Red)', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 640, sellingPrice: 800 },
    { name: 'Lal Masoor', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 295, sellingPrice: 480 },
    { name: 'Millets (Bajra)', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 125, sellingPrice: 160 },
    { name: 'Mixed Dana', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 0, sellingPrice: 0 },
    { name: 'Mughal Rice', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 0, sellingPrice: 0 },
    { name: 'Red Rice', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 220, sellingPrice: 380 },
    { name: 'Roasted Chickpeas', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 600, sellingPrice: 1000 },
    { name: 'Roasted Chickpeas (W/o Skin)', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 700, sellingPrice: 1100 },
    { name: 'Sella Rice', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 340, sellingPrice: 450 },
    { name: 'Soya Bean', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 480, sellingPrice: 1000 },
    { name: 'Split Chickpeas (Channay Ki Daal)', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 290, sellingPrice: 540 },
    { name: 'Star Rice', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 220, sellingPrice: 350 },
    { name: 'Super Kernel Basmati', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 355, sellingPrice: 450 },
    { name: 'Taj Mehal rice', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 355, sellingPrice: 450 },
    { name: 'Ujala Rice', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 0, sellingPrice: 0 },
    { name: 'Wheat', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 150, sellingPrice: 240 },
    { name: 'White Beans', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 400, sellingPrice: 700 },
    { name: 'White Chickpeas (Large)', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 480, sellingPrice: 680 },
    { name: 'White Chickpeas (small)', unit: 'Kgs', category: 'Grains, Pulses & Rice', purchaseRate: 320, sellingPrice: 480 },
];

async function updateGrainsPulsesRicePricing() {
    try {
        console.log(`📋 Processing ${grainsPulsesRiceProducts.length} Grains, Pulses & Rice products\n`);

        const results = [];
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < grainsPulsesRiceProducts.length; i++) {
            const prod = grainsPulsesRiceProducts[i];
            
            try {
                // Skip products with 0 selling price (they need manual pricing)
                if (prod.sellingPrice === 0) {
                    console.log(`\n[${i + 1}/${grainsPulsesRiceProducts.length}] ⚠️  Skipping: ${prod.name} (Selling Price is 0)`);
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

                console.log(`\n[${i + 1}/${grainsPulsesRiceProducts.length}] Processing: ${enhancedProd.name}`);
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
        console.log(`📦 Total: ${grainsPulsesRiceProducts.length}`);
        console.log('='.repeat(60));

        // Save results to file
        const resultsPath = require('path').join(__dirname, '../../grains-pulses-rice-update-results.json');
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
updateGrainsPulsesRicePricing()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });


