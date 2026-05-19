import { prisma } from '../src/prisma/client';
import { ProductService } from '../src/services/product.service';

const productService = new ProductService();

// Traditional Confectionery products data
const traditionalConfectioneryProducts = [
    { name: 'Almond Chikki', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 2670, sellingPrice: 4800 },
    { name: 'Black Sesame Chikki', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 900, sellingPrice: 1600 },
    { name: 'Cashew Chikki', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 3270, sellingPrice: 4800 },
    { name: 'Chickpeas Chikki', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 790, sellingPrice: 1200 },
    { name: 'Coconut Chikki', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 1150, sellingPrice: 1600 },
    { name: 'Flat Gajak', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 650, sellingPrice: 1200 },
    { name: 'Flax Seeds Chikki', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 500, sellingPrice: 2000 },
    { name: 'Gajak Roll Box', unit: 'Pcs', category: 'Traditional Confectionery', purchaseRate: 650, sellingPrice: 700 },
    { name: 'Mixed Nuts Chikki', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 3870, sellingPrice: 5600 },
    { name: 'Peanut Chikki', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 900, sellingPrice: 1200 },
    { name: 'Pehalwan Reawri (250gms)', unit: 'Pcs', category: 'Traditional Confectionery', purchaseRate: 600, sellingPrice: 280 },
    { name: 'Pehalwan Reawri (500gms)', unit: 'Pcs', category: 'Traditional Confectionery', purchaseRate: 600, sellingPrice: 560 },
    { name: 'Pistachio Chikki', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 5000, sellingPrice: 8000 },
    { name: 'Puffed Rice Balls', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 80, sellingPrice: 150 },
    { name: 'Puffed Rice Chikki', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 185, sellingPrice: 300 },
    { name: 'Reawri', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 350, sellingPrice: 1200 },
    { name: 'Roti Gajak', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 650, sellingPrice: 1200 },
    { name: 'Round Gajak', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 650, sellingPrice: 1200 },
    { name: 'Sesame Balls (Small)', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 650, sellingPrice: 300 },
    { name: 'Sesame Chikki', unit: 'Kgs', category: 'Traditional Confectionery', purchaseRate: 400, sellingPrice: 1200 },
];

async function updateTraditionalConfectioneryPricing() {
    try {
        console.log(`📋 Processing ${traditionalConfectioneryProducts.length} Traditional Confectionery products\n`);

        const results = [];
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < traditionalConfectioneryProducts.length; i++) {
            const prod = traditionalConfectioneryProducts[i];
            
            try {
                // Skip products with 0 selling price (they need manual pricing)
                if (prod.sellingPrice === 0) {
                    console.log(`\n[${i + 1}/${traditionalConfectioneryProducts.length}] ⚠️  Skipping: ${prod.name} (Selling Price is 0)`);
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

                console.log(`\n[${i + 1}/${traditionalConfectioneryProducts.length}] Processing: ${enhancedProd.name}`);
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
        console.log(`📦 Total: ${traditionalConfectioneryProducts.length}`);
        console.log('='.repeat(60));

        // Save results to file
        const resultsPath = require('path').join(__dirname, '../../traditional-confectionery-update-results.json');
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
updateTraditionalConfectioneryPricing()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });


