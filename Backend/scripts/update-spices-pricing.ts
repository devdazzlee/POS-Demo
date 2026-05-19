import { prisma } from '../src/prisma/client';
import { ProductService } from '../src/services/product.service';

const productService = new ProductService();

// Spices products data
const spicesProducts = [
    { name: 'Achar Gosht Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 800, sellingPrice: 2400 },
    { name: 'Achar Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 800, sellingPrice: 2400 },
    { name: 'BBQ Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 880, sellingPrice: 2400 },
    { name: 'Bihari Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 880, sellingPrice: 2400 },
    { name: 'Biryani Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 880, sellingPrice: 2400 },
    { name: 'Black Cardamom (Bari Elaichi)', unit: 'Kgs', category: 'Spices', purchaseRate: 8000, sellingPrice: 11000 },
    { name: 'Black Cumin (Kaala Zeera)', unit: 'Kgs', category: 'Spices', purchaseRate: 1320, sellingPrice: 1800 },
    { name: 'Black Pepper (Kaali Mirch)', unit: 'Kgs', category: 'Spices', purchaseRate: 1200, sellingPrice: 3600 },
    { name: 'Black Pepper Powder (Kaali Mirch)', unit: 'Kgs', category: 'Spices', purchaseRate: 1280, sellingPrice: 3800 },
    { name: 'Black Prunes (Kandhari)', unit: 'Kgs', category: 'Spices', purchaseRate: 920, sellingPrice: 1800 },
    { name: 'Black Salt Grounded', unit: 'Kgs', category: 'Spices', purchaseRate: 80, sellingPrice: 800 },
    { name: 'Black Seeds (Kalonji)', unit: 'Kgs', category: 'Spices', purchaseRate: 840, sellingPrice: 1800 },
    { name: 'Black Seeds Powder (Kalonji)', unit: 'Kgs', category: 'Spices', purchaseRate: 900, sellingPrice: 2400 },
    { name: 'Carom Seeds (Ajwain)', unit: 'Kgs', category: 'Spices', purchaseRate: 360, sellingPrice: 800 },
    { name: 'Carom Seeds Powder (Ajwain)', unit: 'Kgs', category: 'Spices', purchaseRate: 380, sellingPrice: 1200 },
    { name: 'Chat Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 400, sellingPrice: 1200 },
    { name: 'Chicken Powder', unit: 'Kgs', category: 'Spices', purchaseRate: 480, sellingPrice: 1000 },
    { name: 'Chinese Salt', unit: 'Kgs', category: 'Spices', purchaseRate: 800, sellingPrice: 2400 },
    { name: 'Cinnamon Ceylon (Round)', unit: 'Kgs', category: 'Spices', purchaseRate: 2000, sellingPrice: 4400 },
    { name: 'Cinnamon- Cassia', unit: 'Kgs', category: 'Spices', purchaseRate: 900, sellingPrice: 2000 },
    { name: 'Cinnamon- Cassia Powder', unit: 'Kgs', category: 'Spices', purchaseRate: 1000, sellingPrice: 2400 },
    { name: 'Citric Acid (Tatri)', unit: 'Kgs', category: 'Spices', purchaseRate: 320, sellingPrice: 1200 },
    { name: 'Cloves (Long)', unit: 'Kgs', category: 'Spices', purchaseRate: 2900, sellingPrice: 5600 },
    { name: 'Cloves Powder (Long)', unit: 'Kgs', category: 'Spices', purchaseRate: 3600, sellingPrice: 6000 },
    { name: 'Coriander Seeds (Sabut Dhanya)', unit: 'Kgs', category: 'Spices', purchaseRate: 480, sellingPrice: 1200 },
    { name: 'Coriander Seeds Powder (Pisa Dhanya)', unit: 'Kgs', category: 'Spices', purchaseRate: 500, sellingPrice: 1400 },
    { name: 'Crushed Coriander (Kuta Dhanya)', unit: 'Kgs', category: 'Spices', purchaseRate: 500, sellingPrice: 1400 },
    { name: 'Crushed Fenugreek Seeds (Kuta Methi Dana)', unit: 'Kgs', category: 'Spices', purchaseRate: 320, sellingPrice: 1000 },
    { name: 'Crushed Red Chilli', unit: 'Kgs', category: 'Spices', purchaseRate: 650, sellingPrice: 1800 },
    { name: 'Curry Leaves Powder', unit: 'Kgs', category: 'Spices', purchaseRate: 0, sellingPrice: 0 },
    { name: 'Dahi Barra Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 680, sellingPrice: 1800 },
    { name: 'Dried Ginger Grounded (Sonth)', unit: 'Kgs', category: 'Spices', purchaseRate: 1280, sellingPrice: 2800 },
    { name: 'Fennel Seeds', unit: 'Kgs', category: 'Spices', purchaseRate: 680, sellingPrice: 1600 },
    { name: 'Fennel Seeds Powder', unit: 'Kgs', category: 'Spices', purchaseRate: 560, sellingPrice: 2400 },
    { name: 'Fenugreek Seeds (Methi Daana)', unit: 'Kgs', category: 'Spices', purchaseRate: 240, sellingPrice: 800 },
    { name: 'Fish Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 880, sellingPrice: 2400 },
    { name: 'Garam Masalah Mix (Whole)', unit: 'Kgs', category: 'Spices', purchaseRate: 2400, sellingPrice: 4800 },
    { name: 'Garam Masalah Powder', unit: 'Kgs', category: 'Spices', purchaseRate: 1800, sellingPrice: 5600 },
    { name: 'Garlic (Lehsan) Powder', unit: 'Kgs', category: 'Spices', purchaseRate: 1040, sellingPrice: 1400 },
    { name: 'General Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 960, sellingPrice: 2400 },
    { name: 'Golden Prunes', unit: 'Kgs', category: 'Spices', purchaseRate: 560, sellingPrice: 1800 },
    { name: 'Green Cardamom (Elaichi)', unit: 'Kgs', category: 'Spices', purchaseRate: 10800, sellingPrice: 14000 },
    { name: 'Green Cardamom Powder (Elaichi)', unit: 'Kgs', category: 'Spices', purchaseRate: 9600, sellingPrice: 15000 },
    { name: 'Kabab Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 880, sellingPrice: 2400 },
    { name: 'Kachri (Whole)', unit: 'Kgs', category: 'Spices', purchaseRate: 500, sellingPrice: 1200 },
    { name: 'Kachri Powder', unit: 'Kgs', category: 'Spices', purchaseRate: 650, sellingPrice: 1400 },
    { name: 'Kaleji Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 880, sellingPrice: 2400 },
    { name: 'Karahi Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 880, sellingPrice: 2400 },
    { name: 'Kasuri Methi', unit: 'Kgs', category: 'Spices', purchaseRate: 240, sellingPrice: 1000 },
    { name: 'Khashkhash', unit: 'Kgs', category: 'Spices', purchaseRate: 800, sellingPrice: 1600 },
    { name: 'Khatai (Whole)', unit: 'Kgs', category: 'Spices', purchaseRate: 140, sellingPrice: 1200 },
    { name: 'Khatai Powder', unit: 'Kgs', category: 'Spices', purchaseRate: 280, sellingPrice: 1400 },
    { name: 'Lahori Salt (Whole)', unit: 'Kgs', category: 'Spices', purchaseRate: 30, sellingPrice: 100 },
    { name: 'Lahori Salt Powder', unit: 'Kgs', category: 'Spices', purchaseRate: 30, sellingPrice: 100 },
    { name: 'Mace (Javitri)', unit: 'Kgs', category: 'Spices', purchaseRate: 7600, sellingPrice: 9600 },
    { name: 'Mace Powder (Javitri-Box)', unit: 'Pcs', category: 'Spices', purchaseRate: 25, sellingPrice: 16000 },
    { name: 'Mace Powder (Javitri)', unit: 'Kgs', category: 'Spices', purchaseRate: 6700, sellingPrice: 0 },
    { name: 'Marwari Mirch', unit: 'Kgs', category: 'Spices', purchaseRate: 750, sellingPrice: 1200 },
    { name: 'Mixed Red Chilli Powder', unit: 'Kgs', category: 'Spices', purchaseRate: 900, sellingPrice: 1800 },
    { name: 'Mixed Salan Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 880, sellingPrice: 2400 },
    { name: 'Mustard Seeds', unit: 'Kgs', category: 'Spices', purchaseRate: 280, sellingPrice: 800 },
    { name: 'Mustard Seeds Powder', unit: 'Kgs', category: 'Spices', purchaseRate: 480, sellingPrice: 1000 },
    { name: 'National Salt', unit: 'Kgs', category: 'Spices', purchaseRate: 58, sellingPrice: 100 },
    { name: 'Nihari Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 880, sellingPrice: 2400 },
    { name: 'Nutmeg (Jaifal)', unit: 'Kgs', category: 'Spices', purchaseRate: 1800, sellingPrice: 6000 },
    { name: 'Nutmeg powder (Jaifal-Box)', unit: 'Pcs', category: 'Spices', purchaseRate: 2900, sellingPrice: 16000 },
    { name: 'Nutmeg Powder (Jaifal)', unit: 'Kgs', category: 'Spices', purchaseRate: 4100, sellingPrice: 0 },
    { name: 'Pakora Mix', unit: 'Kgs', category: 'Spices', purchaseRate: 560, sellingPrice: 1800 },
    { name: 'Paprika (Whole)', unit: 'Kgs', category: 'Spices', purchaseRate: 1050, sellingPrice: 4000 },
    { name: 'Paprika Powder', unit: 'Kgs', category: 'Spices', purchaseRate: 1000, sellingPrice: 2400 },
    { name: 'Patna Red Chilli', unit: 'Kgs', category: 'Spices', purchaseRate: 700, sellingPrice: 1600 },
    { name: 'Paya Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 880, sellingPrice: 2400 },
    { name: 'Persian Cumin (Special Zeera)', unit: 'Kgs', category: 'Spices', purchaseRate: 2800, sellingPrice: 4000 },
    { name: 'Pink Salt', unit: 'Kgs', category: 'Spices', purchaseRate: 30, sellingPrice: 100 },
    { name: 'Pipliyan', unit: 'Kgs', category: 'Spices', purchaseRate: 3200, sellingPrice: 4800 },
    { name: 'Pomegranate (Anaar) Seeds', unit: 'Kgs', category: 'Spices', purchaseRate: 500, sellingPrice: 1800 },
    { name: 'Pomegranate (Anaar) seeds Powder', unit: 'Kgs', category: 'Spices', purchaseRate: 540, sellingPrice: 2400 },
    { name: 'Pulao Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 880, sellingPrice: 2400 },
    { name: 'Qorma Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 880, sellingPrice: 2400 },
    { name: 'Round Red Chilli (Whole)', unit: 'Kgs', category: 'Spices', purchaseRate: 1050, sellingPrice: 1600 },
    { name: 'Round Red Chilli Powder', unit: 'Kgs', category: 'Spices', purchaseRate: 750, sellingPrice: 1800 },
    { name: 'Seekh Kabab Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 880, sellingPrice: 2400 },
    { name: 'Silver Coated Cardamom (Elaichi)', unit: 'Kgs', category: 'Spices', purchaseRate: 6000, sellingPrice: 20000 },
    { name: 'Star Anise (Badian K Phool)', unit: 'Kgs', category: 'Spices', purchaseRate: 1280, sellingPrice: 4800 },
    { name: 'Tamarind', unit: 'Kgs', category: 'Spices', purchaseRate: 340, sellingPrice: 700 },
    { name: 'Tikka Masalah', unit: 'Kgs', category: 'Spices', purchaseRate: 880, sellingPrice: 2400 },
    { name: 'Tukhm e Balanga', unit: 'Kgs', category: 'Spices', purchaseRate: 1000, sellingPrice: 2800 },
    { name: 'Turmeric (Whole)', unit: 'Kgs', category: 'Spices', purchaseRate: 750, sellingPrice: 1600 },
    { name: 'Turmeric Powder', unit: 'Kgs', category: 'Spices', purchaseRate: 650, sellingPrice: 1800 },
    { name: 'White Cumin (Safaid Zeera)', unit: 'Kgs', category: 'Spices', purchaseRate: 1600, sellingPrice: 3600 },
    { name: 'White Cumin Powder (Zeera Powder)', unit: 'Kgs', category: 'Spices', purchaseRate: 1200, sellingPrice: 3800 },
    { name: 'White Pepper (Grounded)', unit: 'Kgs', category: 'Spices', purchaseRate: 3400, sellingPrice: 5200 },
    { name: 'White Pepper (Whole)', unit: 'Kgs', category: 'Spices', purchaseRate: 2300, sellingPrice: 4800 },
    { name: 'White Sesame seed (Safaid Til)', unit: 'Kgs', category: 'Spices', purchaseRate: 560, sellingPrice: 1800 },
    { name: 'Whole Dried Ginger (Sonth)', unit: 'Kgs', category: 'Spices', purchaseRate: 1200, sellingPrice: 2400 },
    { name: 'Yellow Mustard', unit: 'Kgs', category: 'Spices', purchaseRate: 400, sellingPrice: 1600 },
    { name: 'Bay leaf (Tez Patta)', unit: 'Kgs', category: 'Spices', purchaseRate: 720, sellingPrice: 1500 },
    { name: 'Green Cardamom Seeds', unit: 'Kgs', category: 'Herbs', purchaseRate: 10000, sellingPrice: 20000 },
    { name: 'Black Cardamom Seeds', unit: 'Kgs', category: 'Herbs', purchaseRate: 8000, sellingPrice: 16000 },
    { name: 'Black Sesame seeds (Kaala Til)', unit: 'Kgs', category: 'Herbs', purchaseRate: 750, sellingPrice: 1600 },
];

async function updateSpicesPricing() {
    try {
        console.log(`📋 Processing ${spicesProducts.length} Spices products\n`);

        const results = [];
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < spicesProducts.length; i++) {
            const prod = spicesProducts[i];
            
            try {
                // Skip products with 0 selling price (they need manual pricing)
                if (prod.sellingPrice === 0) {
                    console.log(`\n[${i + 1}/${spicesProducts.length}] ⚠️  Skipping: ${prod.name} (Selling Price is 0)`);
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

                console.log(`\n[${i + 1}/${spicesProducts.length}] Processing: ${enhancedProd.name}`);
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
        console.log(`📦 Total: ${spicesProducts.length}`);
        console.log('='.repeat(60));

        // Save results to file
        const resultsPath = require('path').join(__dirname, '../../spices-update-results.json');
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
updateSpicesPricing()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });


