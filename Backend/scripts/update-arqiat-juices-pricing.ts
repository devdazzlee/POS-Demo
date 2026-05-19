import { prisma } from '../src/prisma/client';
import { ProductService } from '../src/services/product.service';

const productService = new ProductService();

// Arqiat & Juices products data
const arqiatJuicesProducts = [
    { name: 'AB Icecream Soda', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 350, sellingPrice: 400 },
    { name: 'AB Pineapple Sharbat', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 350, sellingPrice: 400 },
    { name: 'Ab Sharbat e Anaar', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 350, sellingPrice: 400 },
    { name: 'AB Sharbat e Blueberry', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 350, sellingPrice: 400 },
    { name: 'AB Sharbat e Gulab', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 350, sellingPrice: 400 },
    { name: 'AB Sharbat e Lychee', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 350, sellingPrice: 400 },
    { name: 'AB Sharbat e Mango', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 350, sellingPrice: 400 },
    { name: 'AB Sharbat e Orange', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 350, sellingPrice: 400 },
    { name: 'AB Sharbat e Peach', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 350, sellingPrice: 400 },
    { name: 'AB Sharbat e Sandal', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 350, sellingPrice: 400 },
    { name: 'AQ Arq Dasmol', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 220, sellingPrice: 340 },
    { name: 'AQ Arq e Ajwain', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 160, sellingPrice: 240 },
    { name: 'AQ Arq e Badian', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 160, sellingPrice: 240 },
    { name: 'AQ Arq e Gaozban', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 160, sellingPrice: 240 },
    { name: 'AQ Arq e Gulab', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 120, sellingPrice: 250 },
    { name: 'AQ Arq e Gulab Spray', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 100, sellingPrice: 150 },
    { name: 'AQ Arq e Kasni', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 160, sellingPrice: 240 },
    { name: 'AQ Arq e Makoh', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 160, sellingPrice: 240 },
    { name: 'AQ Arq Mehzal', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 220, sellingPrice: 450 },
    { name: 'AQ Arq Poudina', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 160, sellingPrice: 240 },
    { name: 'AQ Chaw Arqa', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 160, sellingPrice: 240 },
    { name: 'AQ Jam e Shifa (250ml)', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 150, sellingPrice: 300 },
    { name: 'AQ Jam e Shifa (800ml)', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 450, sellingPrice: 700 },
    { name: 'AQ Sharbat e Anjbar', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 250, sellingPrice: 350 },
    { name: 'AQ Sharbat e Badam', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 280, sellingPrice: 480 },
    { name: 'AQ Sharbat e Elaichi', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 250, sellingPrice: 350 },
    { name: 'AQ Sharbat e Unaab', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 250, sellingPrice: 440 },
    { name: 'AQ Sharbat Pomegranate (Anar)', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 320, sellingPrice: 470 },
    { name: 'AQ Sharbat Sandal', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 320, sellingPrice: 490 },
    { name: 'AQ Sharbat Tamarind & Prunes', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 320, sellingPrice: 440 },
    { name: 'Aqua Slim', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 0, sellingPrice: 0 },
    { name: 'Arq e Makoh (Marhaba)', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 0, sellingPrice: 0 },
    { name: 'Arq Nana', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 66.67, sellingPrice: 200 },
    { name: 'Dittus Apple Vinegar', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 480, sellingPrice: 550 },
    { name: 'Dittus Grape Vinegar', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 480, sellingPrice: 550 },
    { name: 'Jaman Vinegar', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 280, sellingPrice: 400 },
    { name: 'MP Arq Gulab ( 800 ml )', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 63, sellingPrice: 250 },
    { name: 'Rooh Kewra ( 800 ML )', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 100, sellingPrice: 250 },
    { name: 'Rooh Kewra 300 ml', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 0, sellingPrice: 120 }, // Purchase rate was "Default", treating as 0
    { name: 'Sharbat E Bazoori', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 320, sellingPrice: 490 },
    { name: 'Sharbat e Roohafza (Hamdard)', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 0, sellingPrice: 0 }, // Both empty
    { name: 'Thadal', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 550, sellingPrice: 600 },
    { name: 'Zafrani Kewra ( 800 ML )', unit: 'Pcs', category: 'Arqiat & Juices', purchaseRate: 100, sellingPrice: 250 },
];

async function updateArqiatJuicesPricing() {
    try {
        console.log(`📋 Processing ${arqiatJuicesProducts.length} Arqiat & Juices products\n`);

        const results = [];
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < arqiatJuicesProducts.length; i++) {
            const prod = arqiatJuicesProducts[i];
            
            try {
                // Skip products with 0 selling price (they need manual pricing)
                if (prod.sellingPrice === 0) {
                    console.log(`\n[${i + 1}/${arqiatJuicesProducts.length}] ⚠️  Skipping: ${prod.name} (Selling Price is 0)`);
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

                console.log(`\n[${i + 1}/${arqiatJuicesProducts.length}] Processing: ${enhancedProd.name}`);
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
        console.log(`📦 Total: ${arqiatJuicesProducts.length}`);
        console.log('='.repeat(60));

        // Save results to file
        const resultsPath = require('path').join(__dirname, '../../arqiat-juices-update-results.json');
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
updateArqiatJuicesPricing()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });


