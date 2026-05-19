import { prisma } from '../src/prisma/client';
import { ProductService } from '../src/services/product.service';

const productService = new ProductService();

// Scents & Perfumes products data
const scentsPerfumesProducts = [
    { name: 'Al Mataf Scent', unit: 'Pcs', category: 'SCENT & PERFUMES', purchaseRate: 4800, sellingPrice: 1200 },
    { name: 'Amir Al Oud Scent', unit: 'Pcs', category: 'SCENT & PERFUMES', purchaseRate: 6000, sellingPrice: 1200 },
    { name: 'Oud Wood Scent', unit: 'Pcs', category: 'SCENT & PERFUMES', purchaseRate: 4200, sellingPrice: 1200 },
    { name: 'Kalemat Scent', unit: 'Pcs', category: 'SCENT & PERFUMES', purchaseRate: 5300, sellingPrice: 1200 },
    { name: 'Air Freshener Spray', unit: 'Pcs', category: 'SCENT & PERFUMES', purchaseRate: 1920, sellingPrice: 3000 },
    { name: 'Fancy Burner', unit: 'Pcs', category: 'SCENT & PERFUMES', purchaseRate: 450, sellingPrice: 1200 },
    { name: 'Bakhoor', unit: 'Pcs', category: 'SCENT & PERFUMES', purchaseRate: 315, sellingPrice: 550 },
];

async function updateScentsPerfumesPricing() {
    try {
        console.log(`📋 Processing ${scentsPerfumesProducts.length} Scents & Perfumes products\n`);

        const results = [];
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < scentsPerfumesProducts.length; i++) {
            const prod = scentsPerfumesProducts[i];
            
            try {
                // Skip products with 0 selling price (they need manual pricing)
                if (prod.sellingPrice === 0) {
                    console.log(`\n[${i + 1}/${scentsPerfumesProducts.length}] ⚠️  Skipping: ${prod.name} (Selling Price is 0)`);
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

                console.log(`\n[${i + 1}/${scentsPerfumesProducts.length}] Processing: ${enhancedProd.name}`);
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
        console.log(`📦 Total: ${scentsPerfumesProducts.length}`);
        console.log('='.repeat(60));

        // Save results to file
        const resultsPath = require('path').join(__dirname, '../../scents-perfumes-update-results.json');
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
updateScentsPerfumesPricing()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });


