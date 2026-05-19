import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { prisma } from '../src/prisma/client';
import { ProductService } from '../src/services/product.service';

const productService = new ProductService();

async function retryFailedProducts() {
    try {
        // Read the results file to get failed products
        const resultsPath = path.join(__dirname, '../../pricing-update-results.json');
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
        
        const failedProducts = results.filter((r: any) => !r.success);
        console.log(`📋 Found ${failedProducts.length} failed products to retry\n`);

        if (failedProducts.length === 0) {
            console.log('✅ No failed products to retry!');
            return;
        }

        const retryResults = [];
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < failedProducts.length; i++) {
            const prod: any = failedProducts[i].data;
            
            try {
                // Map XLSX columns to our data structure
                const purchaseRate = prod['Purchase Rate'] || prod.purchase_rate || 0;
                const sellingPrice = prod['Selling Price'] || prod.selling_price || 
                                    prod.sales_rate_exc_dis_and_tax || prod.sales_rate_inc_dis_and_tax || 0;
                
                const enhancedProd = {
                    name: prod.Name || prod.name,
                    purchase_rate: Number(purchaseRate) || 0,
                    sales_rate_exc_dis_and_tax: Number(sellingPrice) || 0,
                    sales_rate_inc_dis_and_tax: Number(sellingPrice) || 0,
                    min_qty: Number(prod.min_qty) || 10,
                    max_qty: Number(prod.max_qty) || 10,
                    is_active: true,
                    display_on_pos: true,
                    is_batch: false,
                    auto_fill_on_demand_sheet: false,
                    non_inventory_item: false,
                    is_deal: false,
                    is_featured: false,
                    description: prod.description || '',
                    pct_or_hs_code: prod.pct_or_hs_code || '',
                    sku: '', // Empty SKU - will use existing or generate new
                    discount_amount: 0,
                    unit_name: prod.Unit || prod.unit || 'Kgs',
                    category_name: prod.Category || prod.category || 'Dried Fruits & Nuts',
                    subcategory_name: prod.Subcategory || prod.subcategory || '',
                    tax_name: prod.Tax || prod.tax || '',
                    supplier_name: prod.Supplier || prod.supplier || '',
                    brand_name: prod.Brand || prod.brand || '',
                    color_name: prod.Color || prod.color || '',
                    size_name: prod.Size || prod.size || '',
                };

                // Validate required fields
                if (!enhancedProd.name) {
                    throw new Error('Missing required field: name');
                }
                
                if (!enhancedProd.sales_rate_exc_dis_and_tax) {
                    throw new Error('Missing required field: selling price');
                }

                console.log(`\n[${i + 1}/${failedProducts.length}] Retrying: ${enhancedProd.name}`);
                console.log(`   Purchase Rate: ${enhancedProd.purchase_rate}`);
                console.log(`   Selling Price: ${enhancedProd.sales_rate_exc_dis_and_tax}`);

                const result = await productService.createProductFromBulkUpload(enhancedProd);
                
                retryResults.push({ 
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
                retryResults.push({ 
                    success: false, 
                    error: errorMsg, 
                    data: prod 
                });
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 RETRY SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        console.log(`📦 Total Retried: ${failedProducts.length}`);
        console.log('='.repeat(60));

        // Save retry results
        const retryResultsPath = path.join(__dirname, '../../pricing-retry-results.json');
        fs.writeFileSync(retryResultsPath, JSON.stringify(retryResults, null, 2));
        console.log(`\n💾 Retry results saved to: ${retryResultsPath}`);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
retryFailedProducts()
    .then(() => {
        console.log('\n✅ Retry script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Retry script failed:', error);
        process.exit(1);
    });


