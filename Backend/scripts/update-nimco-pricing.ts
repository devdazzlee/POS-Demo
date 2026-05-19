import { prisma } from '../src/prisma/client';
import { ProductService } from '../src/services/product.service';

const productService = new ProductService();

// Nimco products data
// Note: Purchase Rate column shows "Default" but actual values follow
const nimcoProducts = [
    { name: 'Bareeq Sev (250gms)', unit: 'Pcs', category: 'Nimco', purchaseRate: 440, sellingPrice: 960 },
    { name: 'Bareeq Gathiya (250gms)', unit: 'Pcs', category: 'Nimco', purchaseRate: 460, sellingPrice: 960 },
    { name: 'Bhel Poori (250gms)', unit: 'Pcs', category: 'Nimco', purchaseRate: 520, sellingPrice: 960 },
    { name: 'Boondian Bareeq (250gms)', unit: 'Pcs', category: 'Nimco', purchaseRate: 440, sellingPrice: 1200 },
    { name: 'Boondian (250gms)', unit: 'Pcs', category: 'Nimco', purchaseRate: 440, sellingPrice: 1200 },
    { name: 'Chat Papri (80gms)', unit: 'Pcs', category: 'Nimco', purchaseRate: 450, sellingPrice: 1250 },
    { name: 'Chewara (250gms)', unit: 'Pcs', category: 'Nimco', purchaseRate: 440, sellingPrice: 960 },
    { name: 'Daal Mooth (250gms)', unit: 'Pcs', category: 'Nimco', purchaseRate: 440, sellingPrice: 960 },
    { name: 'Manda Papri (150gms)', unit: 'Pcs', category: 'Nimco', purchaseRate: 120, sellingPrice: 280 },
    { name: 'Masalah Gathiya (300gms)', unit: 'Pcs', category: 'Nimco', purchaseRate: 480, sellingPrice: 960 },
    { name: 'Mix Nimco (250gms)', unit: 'Pcs', category: 'Nimco', purchaseRate: 500, sellingPrice: 960 },
    { name: 'Daal Moong (250 gms)', unit: 'Pcs', category: 'Nimco', purchaseRate: 540, sellingPrice: 1120 },
    { name: 'Sweet Chewara (250gms)', unit: 'Pcs', category: 'Nimco', purchaseRate: 460, sellingPrice: 960 },
    { name: 'Thick Gathiya (250gms)', unit: 'Pcs', category: 'Nimco', purchaseRate: 480, sellingPrice: 960 },
];

async function updateNimcoPricing() {
    try {
        console.log(`📋 Processing ${nimcoProducts.length} Nimco products\n`);

        const results = [];
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < nimcoProducts.length; i++) {
            const prod = nimcoProducts[i];
            
            try {
                // Skip products with 0 selling price (they need manual pricing)
                if (prod.sellingPrice === 0) {
                    console.log(`\n[${i + 1}/${nimcoProducts.length}] ⚠️  Skipping: ${prod.name} (Selling Price is 0)`);
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

                console.log(`\n[${i + 1}/${nimcoProducts.length}] Processing: ${enhancedProd.name}`);
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
        console.log(`📦 Total: ${nimcoProducts.length}`);
        console.log('='.repeat(60));

        // Save results to file
        const resultsPath = require('path').join(__dirname, '../../nimco-update-results.json');
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
updateNimcoPricing()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });


