import { prisma } from '../src/prisma/client';
import { ProductService } from '../src/services/product.service';

const productService = new ProductService();

// General Products data
const generalProducts = [
    { name: '2 Piece Betel Nut', unit: 'Kgs', category: 'General', purchaseRate: 1800, sellingPrice: 4000 },
    { name: 'Baryan', unit: 'Pcs', category: 'General', purchaseRate: 57.58, sellingPrice: 150 },
    { name: 'Batashay', unit: 'Kgs', category: 'General', purchaseRate: 250, sellingPrice: 1000 },
    { name: 'Brown Sugar', unit: 'Kgs', category: 'General', purchaseRate: 200, sellingPrice: 360 },
    { name: 'China Grass (Whole)', unit: 'Pcs', category: 'General', purchaseRate: 35, sellingPrice: 80 },
    { name: 'China Grass Large (Grounded)', unit: 'Pcs', category: 'General', purchaseRate: 55, sellingPrice: 100 },
    { name: 'China Grass Small (Grounded)', unit: 'Pcs', category: 'General', purchaseRate: 35, sellingPrice: 80 },
    { name: 'Dahi Mirch', unit: 'Pcs', category: 'General', purchaseRate: 200, sellingPrice: 250 },
    { name: 'Desi Ghee', unit: 'Kgs', category: 'General', purchaseRate: 900, sellingPrice: 1800 },
    { name: 'Dhala Misri', unit: 'Kgs', category: 'General', purchaseRate: 250, sellingPrice: 800 },
    { name: 'Dhanya giri', unit: 'Kgs', category: 'General', purchaseRate: 1120, sellingPrice: 1800 },
    { name: 'Essence', unit: 'Pcs', category: 'General', purchaseRate: 50, sellingPrice: 80 },
    { name: 'Fennel Seeds (Sweet)', unit: 'Kgs', category: 'General', purchaseRate: 280, sellingPrice: 600 },
    { name: 'Fine Coal', unit: 'Pcs', category: 'General', purchaseRate: 60, sellingPrice: 150 },
    { name: 'Flavoured Silli Betel Nut', unit: 'Kgs', category: 'General', purchaseRate: 3400, sellingPrice: 6000 },
    { name: 'Flavoured Sunny Betel Nut', unit: 'Kgs', category: 'General', purchaseRate: 3400, sellingPrice: 6000 },
    { name: 'Food Colour', unit: 'Pcs', category: 'General', purchaseRate: 5, sellingPrice: 40 },
    { name: 'ghuriyan', unit: 'Kgs', category: 'General', purchaseRate: 500, sellingPrice: 800 },
    { name: 'Glass Gurr', unit: 'Pcs', category: 'General', purchaseRate: 85, sellingPrice: 140 },
    { name: 'Jaggery (Gurr)', unit: 'Kgs', category: 'General', purchaseRate: 220, sellingPrice: 360 },
    { name: 'Jaggery (Kala Gurr)', unit: 'Kgs', category: 'General', purchaseRate: 250, sellingPrice: 380 },
    { name: 'Kaccha Chewra (Pawa)', unit: 'Kgs', category: 'General', purchaseRate: 320, sellingPrice: 600 },
    { name: 'Key Kewra Water (300ml)', unit: 'Pcs', category: 'General', purchaseRate: 80, sellingPrice: 120 },
    { name: 'khushboo dana', unit: 'Kgs', category: 'General', purchaseRate: 480, sellingPrice: 800 },
    { name: 'Laccha', unit: 'Pcs', category: 'General', purchaseRate: 90, sellingPrice: 200 },
    { name: 'Mango Slice', unit: 'Pcs', category: 'General', purchaseRate: 70, sellingPrice: 140 },
    { name: 'Misri', unit: 'Kgs', category: 'General', purchaseRate: 340, sellingPrice: 800 },
    { name: 'MIx Sweets', unit: 'Pcs', category: 'General', purchaseRate: 0, sellingPrice: 1600 },
    { name: 'MP Chat Hazam Chooran', unit: 'Pcs', category: 'General', purchaseRate: 80, sellingPrice: 150 },
    { name: 'Naqqul (large)', unit: 'Kgs', category: 'General', purchaseRate: 220, sellingPrice: 400 },
    { name: 'Naqqul (small)', unit: 'Kgs', category: 'General', purchaseRate: 220, sellingPrice: 400 },
    { name: 'Popcorn', unit: 'Kgs', category: 'General', purchaseRate: 320, sellingPrice: 700 },
    { name: 'Puffed Rice (Murmuray)', unit: 'Kgs', category: 'General', purchaseRate: 320, sellingPrice: 600 },
    { name: 'Red Anmol Betel Nut', unit: 'Kgs', category: 'General', purchaseRate: 540, sellingPrice: 800 },
    { name: 'Rita Tamarind (M)', unit: 'Pcs', category: 'General', purchaseRate: 11.67, sellingPrice: 40 },
    { name: 'Roasted Paan Masala', unit: 'Kgs', category: 'General', purchaseRate: 1250, sellingPrice: 1800 },
    { name: 'Saffron (0.5gms)', unit: 'Pcs', category: 'General', purchaseRate: 290, sellingPrice: 1000 },
    { name: 'Saghu Dana', unit: 'Kgs', category: 'General', purchaseRate: 300, sellingPrice: 800 },
    { name: 'Silli Betel Nut', unit: 'Kgs', category: 'General', purchaseRate: 3200, sellingPrice: 4000 },
    { name: 'Silver Ball', unit: 'Kgs', category: 'General', purchaseRate: 380, sellingPrice: 800 },
    { name: 'Silver Warq (5)', unit: 'Pcs', category: 'General', purchaseRate: 12.5, sellingPrice: 100 },
    { name: 'Siwayyan', unit: 'Pcs', category: 'General', purchaseRate: 38.33, sellingPrice: 80 },
    { name: 'Sliced Betel Nut', unit: 'Kgs', category: 'General', purchaseRate: 1400, sellingPrice: 4000 },
    { name: 'Star & Polo Mix', unit: 'Kgs', category: 'General', purchaseRate: 300, sellingPrice: 800 },
    { name: 'Sunflower seeds', unit: 'Kgs', category: 'General', purchaseRate: 360, sellingPrice: 480 },
    { name: 'Sunflower Seeds (Roasted)', unit: 'Kgs', category: 'General', purchaseRate: 550, sellingPrice: 1400 },
    { name: 'Sunflower Seeds W/O Shell', unit: 'Kgs', category: 'General', purchaseRate: 800, sellingPrice: 3600 },
    { name: 'Sunny Betel Nut', unit: 'Kgs', category: 'General', purchaseRate: 3200, sellingPrice: 4000 },
    { name: 'Sweet Paan Masala', unit: 'Kgs', category: 'General', purchaseRate: 700, sellingPrice: 1400 },
    { name: 'Sweet Soda Powder', unit: 'Kgs', category: 'General', purchaseRate: 140, sellingPrice: 400 },
    { name: 'Vanilla Essence', unit: 'Pcs', category: 'General', purchaseRate: 50, sellingPrice: 80 },
    { name: 'Zafrani Essence', unit: 'Pcs', category: 'General', purchaseRate: 50, sellingPrice: 80 },
    { name: 'Zafrani Kewra (300 ml)', unit: 'Pcs', category: 'General', purchaseRate: 75, sellingPrice: 120 },
    { name: 'Zarda food colour', unit: 'Kgs', category: 'General', purchaseRate: 560, sellingPrice: 1600 },
    { name: 'Key Synthetic Vinegar (750 ml)', unit: 'Pcs', category: 'General', purchaseRate: 110, sellingPrice: 190 },
    { name: 'Saffron ( 1 gm ) dibya', unit: 'Kgs', category: 'General', purchaseRate: 300, sellingPrice: 1400 },
    { name: 'Key Synthetic Vinegar (300 ml)', unit: 'Pcs', category: 'General', purchaseRate: 70, sellingPrice: 120 },
    { name: 'Green Cardamom (whole) (Eliche) ( AKBER )', unit: 'Kgs', category: 'General', purchaseRate: 14000, sellingPrice: 20000 },
    { name: 'Fried Onion ( 500 GM )', unit: 'Pcs', category: 'General', purchaseRate: 0, sellingPrice: 285 },
    { name: 'Ginger Gurr', unit: 'Kgs', category: 'General', purchaseRate: 0, sellingPrice: 450 },
    { name: 'CHANNA CHIKKI 250 GM', unit: 'Kgs', category: 'General', purchaseRate: 0, sellingPrice: 0 },
    { name: 'Murmuray Chikki', unit: 'Pcs', category: 'General', purchaseRate: 0, sellingPrice: 0 },
    { name: 'Empty Murabba bottles', unit: 'Pcs', category: 'General', purchaseRate: 37.5, sellingPrice: 800 },
    { name: 'EMPTY FOOD COLOR DIBYA', unit: 'Pcs', category: 'General', purchaseRate: 4.44, sellingPrice: 4000 },
    { name: 'Shilajit .10 gm', unit: 'Pcs', category: 'General', purchaseRate: 466.96, sellingPrice: 340 },
];

async function updateGeneralProductsPricing() {
    try {
        console.log(`📋 Processing ${generalProducts.length} General Products\n`);

        const results = [];
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < generalProducts.length; i++) {
            const prod = generalProducts[i];
            
            try {
                // Skip products with 0 selling price (they need manual pricing)
                if (prod.sellingPrice === 0) {
                    console.log(`\n[${i + 1}/${generalProducts.length}] ⚠️  Skipping: ${prod.name} (Selling Price is 0)`);
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

                console.log(`\n[${i + 1}/${generalProducts.length}] Processing: ${enhancedProd.name}`);
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
        console.log(`📦 Total: ${generalProducts.length}`);
        console.log('='.repeat(60));

        // Save results to file
        const resultsPath = require('path').join(__dirname, '../../general-products-update-results.json');
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
updateGeneralProductsPricing()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });


