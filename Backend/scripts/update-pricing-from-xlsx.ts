import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { prisma } from '../src/prisma/client';
import { ProductService } from '../src/services/product.service';

const productService = new ProductService();

async function updatePricingFromXLSX() {
    try {
        // Read the XLSX file
        const filePath = path.join(__dirname, '../../Dried Fruits & Nuts.xlsx');
        
        if (!fs.existsSync(filePath)) {
            console.error('❌ File not found:', filePath);
            process.exit(1);
        }

        console.log('📖 Reading XLSX file:', filePath);
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const products = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`✅ Found ${products.length} products in the file\n`);

        const results = [];
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < products.length; i++) {
            const prod: any = products[i];
            
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
                    sku: prod.sku || prod.SKU || '',
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

                console.log(`\n[${i + 1}/${products.length}] Processing: ${enhancedProd.name}`);
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
        console.log(`❌ Failed: ${errorCount}`);
        console.log(`📦 Total: ${products.length}`);
        console.log('='.repeat(60));

        // Save results to file
        const resultsPath = path.join(__dirname, '../../pricing-update-results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        console.log(`\n💾 Results saved to: ${resultsPath}`);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
updatePricingFromXLSX()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });

