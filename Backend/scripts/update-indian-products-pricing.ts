import { prisma } from '../src/prisma/client';
import { ProductService } from '../src/services/product.service';

const productService = new ProductService();

// Indian Products data
const indianProducts = [
    { name: 'Axe Brand Abu Fass', unit: 'Pcs', category: 'Indian Products', purchaseRate: 180, sellingPrice: 300 },
    { name: 'B-Tex Balm', unit: 'Pcs', category: 'Indian Products', purchaseRate: 220, sellingPrice: 380 },
    { name: 'Baba Elaichi (10 gms)', unit: 'Pcs', category: 'Indian Products', purchaseRate: 550, sellingPrice: 850 },
    { name: 'Budhia Surma', unit: 'Pcs', category: 'Indian Products', purchaseRate: 80, sellingPrice: 150 },
    { name: 'Chandrika Soap', unit: 'Pcs', category: 'Indian Products', purchaseRate: 400, sellingPrice: 650 },
    { name: 'Crack Cream', unit: 'Pcs', category: 'Indian Products', purchaseRate: 220, sellingPrice: 480 },
    { name: 'Dabur Red Toothpaste (L)', unit: 'Pcs', category: 'Indian Products', purchaseRate: 550, sellingPrice: 800 },
    { name: 'Hajmola', unit: 'Pcs', category: 'Indian Products', purchaseRate: 750, sellingPrice: 1200 },
    { name: 'Hawaban Tablet', unit: 'Pcs', category: 'Indian Products', purchaseRate: 180, sellingPrice: 400 },
    { name: 'Indulekha Oil (100 ml)', unit: 'Pcs', category: 'Indian Products', purchaseRate: 800, sellingPrice: 1600 },
    { name: 'Iodex', unit: 'Pcs', category: 'Indian Products', purchaseRate: 280, sellingPrice: 480 },
    { name: 'Itch Guard', unit: 'Pcs', category: 'Indian Products', purchaseRate: 250, sellingPrice: 450 },
    { name: 'Jivan Mixture (60 ml)', unit: 'Pcs', category: 'Indian Products', purchaseRate: 450, sellingPrice: 900 },
    { name: 'Kajal', unit: 'Pcs', category: 'Indian Products', purchaseRate: 90, sellingPrice: 150 },
    { name: 'Kayam Churna', unit: 'Pcs', category: 'Indian Products', purchaseRate: 600, sellingPrice: 950 },
    { name: 'Kayam Tablet', unit: 'Pcs', category: 'Indian Products', purchaseRate: 450, sellingPrice: 800 },
    { name: 'Lookman e Hayat Oil (100 ml)', unit: 'Pcs', category: 'Indian Products', purchaseRate: 550, sellingPrice: 850 },
    { name: 'Moov Cream', unit: 'Pcs', category: 'Indian Products', purchaseRate: 270, sellingPrice: 450 },
    { name: 'Mysore Sandal Soap Large', unit: 'Pcs', category: 'Indian Products', purchaseRate: 650, sellingPrice: 900 },
    { name: 'Navratna Oil (200 ml)', unit: 'Pcs', category: 'Indian Products', purchaseRate: 500, sellingPrice: 950 },
    { name: 'Nurament Oil (50 ml)', unit: 'Pcs', category: 'Indian Products', purchaseRate: 400, sellingPrice: 750 },
    { name: 'Parachute Oil (100 ml)', unit: 'Pcs', category: 'Indian Products', purchaseRate: 450, sellingPrice: 700 },
    { name: 'Pudin Hara Drops', unit: 'Pcs', category: 'Indian Products', purchaseRate: 380, sellingPrice: 600 },
    { name: 'Pudin Hara Tablets', unit: 'Pcs', category: 'Indian Products', purchaseRate: 260, sellingPrice: 350 },
    { name: 'Rajnigandha Silver Pearls', unit: 'Pcs', category: 'Indian Products', purchaseRate: 600, sellingPrice: 950 },
    { name: 'Sandal Soap No. 1', unit: 'Pcs', category: 'Indian Products', purchaseRate: 300, sellingPrice: 480 },
    { name: 'Sudarshan Churan (30 gm)', unit: 'Pcs', category: 'Indian Products', purchaseRate: 350, sellingPrice: 600 },
    { name: 'Tiger Balm Red', unit: 'Pcs', category: 'Indian Products', purchaseRate: 550, sellingPrice: 850 },
    { name: 'Tiger Balm White', unit: 'Pcs', category: 'Indian Products', purchaseRate: 550, sellingPrice: 850 },
    { name: 'Vicco Manjan (50 gms)', unit: 'Pcs', category: 'Indian Products', purchaseRate: 380, sellingPrice: 600 },
    { name: 'Vicco Turmeric (m)', unit: 'Pcs', category: 'Indian Products', purchaseRate: 400, sellingPrice: 650 },
    { name: 'Zandu Ultra Power', unit: 'Pcs', category: 'Indian Products', purchaseRate: 400, sellingPrice: 650 },
];

async function updateIndianProductsPricing() {
    try {
        console.log(`📋 Processing ${indianProducts.length} Indian Products\n`);

        const results = [];
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < indianProducts.length; i++) {
            const prod = indianProducts[i];
            
            try {
                // Skip products with 0 selling price (they need manual pricing)
                if (prod.sellingPrice === 0) {
                    console.log(`\n[${i + 1}/${indianProducts.length}] ⚠️  Skipping: ${prod.name} (Selling Price is 0)`);
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

                console.log(`\n[${i + 1}/${indianProducts.length}] Processing: ${enhancedProd.name}`);
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
        console.log(`📦 Total: ${indianProducts.length}`);
        console.log('='.repeat(60));

        // Save results to file
        const resultsPath = require('path').join(__dirname, '../../indian-products-update-results.json');
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
updateIndianProductsPricing()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });


