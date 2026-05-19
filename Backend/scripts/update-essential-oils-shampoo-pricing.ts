import { prisma } from '../src/prisma/client';
import { ProductService } from '../src/services/product.service';

const productService = new ProductService();

// Essential Oils & Shampoo products data
const essentialOilsShampooProducts = [
    { name: 'Hemani Argan Oil (30ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 410, sellingPrice: 680 },
    { name: 'Hemani Avocado Oil', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 0, sellingPrice: 680 },
    { name: 'Hemani JoJoba Oil (30ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 330, sellingPrice: 680 },
    { name: 'Hemani Orange Oil', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 390, sellingPrice: 650 },
    { name: 'Hemani Rosehip Oil', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 0, sellingPrice: 740 },
    { name: 'Hemani Shifa Oil', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 500, sellingPrice: 850 },
    { name: 'Hemani Vitamin E Oil', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 370, sellingPrice: 680 },
    { name: 'HP Ajwain Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 370, sellingPrice: 550 },
    { name: 'HP Ajwain Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 190, sellingPrice: 450 },
    { name: 'HP Aloe Vera Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 80, sellingPrice: 200 },
    { name: 'HP Aloe Vera Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 160, sellingPrice: 350 },
    { name: 'HP Amla Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 110, sellingPrice: 240 },
    { name: 'HP Amla Oil (60ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 220, sellingPrice: 440 },
    { name: 'HP Amla Reetha Sikakai Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 220, sellingPrice: 440 },
    { name: 'HP Balsan Oil (1gm)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 550, sellingPrice: 1400 },
    { name: 'HP Banafsha Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 170, sellingPrice: 340 },
    { name: 'HP Banafsha Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 330, sellingPrice: 680 },
    { name: 'HP Bitter Almond Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 220, sellingPrice: 450 },
    { name: 'HP Bitter Almond Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 370, sellingPrice: 650 },
    { name: 'HP Bitter Mustard Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 120, sellingPrice: 240 },
    { name: 'HP Bitter Mustard Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 280, sellingPrice: 480 },
    { name: 'HP Black Sesame oil (120 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 350, sellingPrice: 750 },
    { name: 'HP Chamomile Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 110, sellingPrice: 240 },
    { name: 'HP Chamomile Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 230, sellingPrice: 480 },
    { name: 'HP Castor Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 80, sellingPrice: 120 },
    { name: 'HP Castor Oil (60ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 120, sellingPrice: 240 },
    { name: 'HP Cinnamon Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 120, sellingPrice: 240 },
    { name: 'HP Clove Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 220, sellingPrice: 340 },
    { name: 'HP Coriander Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 410, sellingPrice: 640 },
    { name: 'HP Coriander Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 110, sellingPrice: 240 },
    { name: 'HP Egg Oil (30ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 160, sellingPrice: 380 },
    { name: 'HP Egg Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 320, sellingPrice: 740 },
    { name: 'HP Eucalyptus Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 100, sellingPrice: 240 },
    { name: 'HP Euclyptus Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 210, sellingPrice: 480 },
    { name: 'HP Fennel Seeds Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 170, sellingPrice: 380 },
    { name: 'HP Fennel Seeds Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 310, sellingPrice: 580 },
    { name: 'HP Fenugreek Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 110, sellingPrice: 240 },
    { name: 'HP Fenugreek Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 210, sellingPrice: 480 },
    { name: 'HP Fish Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 120, sellingPrice: 300 },
    { name: 'HP Fish Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 240, sellingPrice: 600 },
    { name: 'HP Flax Seed Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 100, sellingPrice: 240 },
    { name: 'HP Flax Seed Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 70, sellingPrice: 120 },
    { name: 'HP Garlic Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 90, sellingPrice: 240 },
    { name: 'HP Ginger Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 90, sellingPrice: 240 },
    { name: 'HP Glycerine Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 120, sellingPrice: 240 },
    { name: 'HP Jasmine Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 110, sellingPrice: 240 },
    { name: 'HP Jasmine Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 230, sellingPrice: 480 },
    { name: 'HP Jojoba Oil', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 280, sellingPrice: 680 },
    { name: 'HP Kahu Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 110, sellingPrice: 240 },
    { name: 'HP Kahu Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 220, sellingPrice: 480 },
    { name: 'HP Kalonji Oil (30ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 210, sellingPrice: 340 },
    { name: 'HP Kalonji Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 320, sellingPrice: 480 },
    { name: 'HP Khashkhash Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 100, sellingPrice: 240 },
    { name: 'HP Khashkhash Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 210, sellingPrice: 480 },
    { name: 'HP Lavender Oil (30ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 170, sellingPrice: 240 },
    { name: 'HP Lavender Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 320, sellingPrice: 480 },
    { name: 'HP Lemon Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 350, sellingPrice: 600 },
    { name: 'HP Maalkangni Oil ( 30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 450, sellingPrice: 800 },
    { name: 'HP Maalkangni Oil ( 60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 430, sellingPrice: 800 },
    { name: 'HP Mixed Melon Seed Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 170, sellingPrice: 240 },
    { name: 'HP Mixed Melon seed Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 320, sellingPrice: 480 },
    { name: 'HP Nabatati Oil', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 350, sellingPrice: 600 },
    { name: 'HP Nabatati Talah Oil (10 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 700, sellingPrice: 1350 },
    { name: 'HP Nagarmotha Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 90, sellingPrice: 240 },
    { name: 'HP Nagarmotha Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 190, sellingPrice: 480 },
    { name: 'HP Neem Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 190, sellingPrice: 300 },
    { name: 'HP Neem Oil (60ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 360, sellingPrice: 600 },
    { name: 'HP Nutmeg Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 160, sellingPrice: 300 },
    { name: 'HP Olive Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 80, sellingPrice: 170 },
    { name: 'HP Olive oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 170, sellingPrice: 340 },
    { name: 'HP Orange Oil (30ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 320, sellingPrice: 650 },
    { name: 'HP Peanut Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 170, sellingPrice: 300 },
    { name: 'HP Peanut Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 350, sellingPrice: 600 },
    { name: 'HP Peppermint Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 140, sellingPrice: 350 },
    { name: 'HP Peppermint Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 280, sellingPrice: 700 },
    { name: 'HP Pistachio Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 500, sellingPrice: 880 },
    { name: 'HP Pistachio Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 750, sellingPrice: 1350 },
    { name: 'HP Pumpkin Seed oil (30ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 220, sellingPrice: 350 },
    { name: 'HP Pumpkin Seed oil (60ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 350, sellingPrice: 650 },
    { name: 'HP Reetha Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 110, sellingPrice: 240 },
    { name: 'HP Reetha Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 110, sellingPrice: 220 },
    { name: 'HP Rose Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 0, sellingPrice: 0 },
    { name: 'HP Rose Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 170, sellingPrice: 480 },
    { name: 'HP Rosemary Oil', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 500, sellingPrice: 800 },
    { name: 'HP Sandal Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 180, sellingPrice: 340 },
    { name: 'HP Sandal Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 360, sellingPrice: 680 },
    { name: 'HP Sikakai Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 70, sellingPrice: 120 },
    { name: 'HP Sikakai Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 220, sellingPrice: 440 },
    { name: 'HP Staff Tree Seed Oil (10 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 220, sellingPrice: 480 },
    { name: 'HP Sweet Almond OIl (30ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 220, sellingPrice: 350 },
    { name: 'HP Sweet Almond Oil (60ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 370, sellingPrice: 550 },
    { name: 'HP Tea Tree Oil (10 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 210, sellingPrice: 400 },
    { name: 'HP Tea Tree Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 400, sellingPrice: 800 },
    { name: 'HP Ushna Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 320, sellingPrice: 550 },
    { name: 'HP Walnut Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 210, sellingPrice: 480 },
    { name: 'HP Walnut Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 430, sellingPrice: 960 },
    { name: 'HP Wheat Oil (60 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 110, sellingPrice: 240 },
    { name: 'MP Cinnamon Oil (60ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 230, sellingPrice: 480 },
    { name: 'Mp Coconut Oil (1 Kg)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 1200, sellingPrice: 1800 },
    { name: 'MP Coconut Oil (125 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 160, sellingPrice: 320 },
    { name: 'Mp Coconut Oil (250 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 300, sellingPrice: 550 },
    { name: 'Mp Coconut Oil (500 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 600, sellingPrice: 900 },
    { name: 'MP Hair oil', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 290, sellingPrice: 550 },
    { name: 'MP Hair Shampoo', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 290, sellingPrice: 550 },
    { name: 'MP Mustard seed Oil (1 kg)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 560, sellingPrice: 1200 },
    { name: 'MP Mustard Seed Oil (2 kg)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 560, sellingPrice: 2400 },
    { name: 'MP Mustard Seed Oil (125 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 130, sellingPrice: 220 },
    { name: 'MP Mustard Seed Oil (250 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 0, sellingPrice: 0 },
    { name: 'Mp Mustard Seed Oil (500 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 600, sellingPrice: 600 },
    { name: 'MP Onion Oil 120 (ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 550, sellingPrice: 800 },
    { name: 'MP Pudina Oil 60 (ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 0, sellingPrice: 0 },
    { name: 'MP Rosemary Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 720, sellingPrice: 1400 },
    { name: 'MP Sesame Seed Oil (125 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 160, sellingPrice: 300 },
    { name: 'MP Sesame Seed Oil (250 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 600, sellingPrice: 600 },
    { name: 'MP Sesame Seed Oil (1 Kg)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 900, sellingPrice: 2400 },
    { name: 'MP Sesame Seeds Oil (500 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 0, sellingPrice: 1200 },
    { name: 'MP Tarpeen Oil (30 ml)', unit: 'Pcs', category: 'Essential Oils & Shampoo', purchaseRate: 0, sellingPrice: 0 },
];

async function updateEssentialOilsShampooPricing() {
    try {
        console.log(`📋 Processing ${essentialOilsShampooProducts.length} Essential Oils & Shampoo products\n`);

        const results = [];
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < essentialOilsShampooProducts.length; i++) {
            const prod = essentialOilsShampooProducts[i];
            
            try {
                // Skip products with 0 selling price (they need manual pricing)
                if (prod.sellingPrice === 0) {
                    console.log(`\n[${i + 1}/${essentialOilsShampooProducts.length}] ⚠️  Skipping: ${prod.name} (Selling Price is 0)`);
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

                console.log(`\n[${i + 1}/${essentialOilsShampooProducts.length}] Processing: ${enhancedProd.name}`);
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
        console.log(`📦 Total: ${essentialOilsShampooProducts.length}`);
        console.log('='.repeat(60));

        // Save results to file
        const resultsPath = require('path').join(__dirname, '../../essential-oils-shampoo-update-results.json');
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
updateEssentialOilsShampooPricing()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });


