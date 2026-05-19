import { prisma } from '../src/prisma/client';
import { ProductService } from '../src/services/product.service';

const productService = new ProductService();

// Crackers products data
const crackersProducts = [
    { name: 'Aalu Masala Crackers', unit: 'Pcs', category: 'Crackers', purchaseRate: 65, sellingPrice: 120 },
    { name: 'Aalu Crackers', unit: 'Pcs', category: 'Crackers', purchaseRate: 65, sellingPrice: 120 },
    { name: 'Mixed Crackers', unit: 'Kgs', category: 'Crackers', purchaseRate: 390, sellingPrice: 100 },
    { name: 'Ball Crackers', unit: 'Kgs', category: 'Crackers', purchaseRate: 360, sellingPrice: 680 },
    { name: 'Chicken Crackers', unit: 'Pcs', category: 'Crackers', purchaseRate: 70, sellingPrice: 100 },
    { name: 'Chinese Crackers', unit: 'Pcs', category: 'Crackers', purchaseRate: 40, sellingPrice: 1800 },
    { name: 'Crazy & Crispy Crackers', unit: 'Pcs', category: 'Crackers', purchaseRate: 70, sellingPrice: 280 },
    { name: 'Dashi Prawn Crackers', unit: 'Pcs', category: 'Crackers', purchaseRate: 240, sellingPrice: 160 },
    { name: 'Farfar Crackers', unit: 'Pcs', category: 'Crackers', purchaseRate: 40, sellingPrice: 250 },
    { name: 'Flower Crackers', unit: 'Kgs', category: 'Crackers', purchaseRate: 360, sellingPrice: 5800 },
    { name: 'Kachori Papad', unit: 'Pcs', category: 'Crackers', purchaseRate: 60, sellingPrice: 50 },
    { name: 'Khichiya Papad', unit: 'Pcs', category: 'Crackers', purchaseRate: 80, sellingPrice: 1200 },
    { name: 'Mix Daal Papad', unit: 'Pcs', category: 'Crackers', purchaseRate: 60, sellingPrice: 280 },
    { name: 'Pipe Crackers', unit: 'Pcs', category: 'Crackers', purchaseRate: 70, sellingPrice: 550 },
    { name: 'Potato Chips', unit: 'Pcs', category: 'Crackers', purchaseRate: 90, sellingPrice: 880 },
    { name: 'Punjabi Masalah Papad', unit: 'Pcs', category: 'Crackers', purchaseRate: 187, sellingPrice: 0 },
    { name: 'Racket Crackers', unit: 'Kgs', category: 'Crackers', purchaseRate: 360, sellingPrice: 8000 },
    { name: 'Rice Crackers', unit: 'Pcs', category: 'Crackers', purchaseRate: 48, sellingPrice: 8000 },
    { name: 'Ring Crackers', unit: 'Pcs', category: 'Crackers', purchaseRate: 60, sellingPrice: 550 },
    { name: 'Sabzi Masalah Crackers', unit: 'Pcs', category: 'Crackers', purchaseRate: 70, sellingPrice: 320 },
    { name: 'Slanty Crackers', unit: 'Kgs', category: 'Crackers', purchaseRate: 500, sellingPrice: 80 },
    { name: 'Shell Crackers', unit: 'Pcs', category: 'Crackers', purchaseRate: 170, sellingPrice: 450 },
    { name: 'Sindhi Masalah Papad', unit: 'Pcs', category: 'Crackers', purchaseRate: 187, sellingPrice: 20000 },
    { name: 'Wave Crackers', unit: 'Pcs', category: 'Crackers', purchaseRate: 25, sellingPrice: 300 },
];

async function updateCrackersPricing() {
    try {
        console.log(`📋 Processing ${crackersProducts.length} Crackers products\n`);

        const results = [];
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < crackersProducts.length; i++) {
            const prod = crackersProducts[i];
            
            try {
                // Skip products with 0 selling price (they need manual pricing)
                if (prod.sellingPrice === 0) {
                    console.log(`\n[${i + 1}/${crackersProducts.length}] ⚠️  Skipping: ${prod.name} (Selling Price is 0)`);
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

                console.log(`\n[${i + 1}/${crackersProducts.length}] Processing: ${enhancedProd.name}`);
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
        console.log(`📦 Total: ${crackersProducts.length}`);
        console.log('='.repeat(60));

        // Save results to file
        const resultsPath = require('path').join(__dirname, '../../crackers-update-results.json');
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
updateCrackersPricing()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });


