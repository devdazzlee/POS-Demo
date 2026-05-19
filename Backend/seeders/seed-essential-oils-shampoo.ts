import { prisma } from '../src/prisma/client';
import * as dotenv from 'dotenv';
import { Prisma } from '@prisma/client';

dotenv.config();

interface ProductInput {
  name: string;
  unit: string;
  category: string;
  purchase_rate?: number | string;
  selling_price: number | string;
}

const products: ProductInput[] = [
  { name: "Hemani Argan Oil (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 410, selling_price: 680 },
  { name: "Hemani Avocado Oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 0, selling_price: 680 },
  { name: "Hemani JoJoba Oil (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 330, selling_price: 680 },
  { name: "Hemani Orange Oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 390, selling_price: 650 },
  { name: "Hemani Rosehip Oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 0, selling_price: 740 },
  { name: "Hemani Shifa Oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 500, selling_price: 850 },
  { name: "Hemani Vitamin E Oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 370, selling_price: 680 },
  { name: "HP Ajwain Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 370, selling_price: 550 },
  { name: "HP Ajwain Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 190, selling_price: 450 },
  { name: "HP Aloe Vera Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 80, selling_price: 200 },
  { name: "HP Aloe Vera Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 160, selling_price: 350 },
  { name: "HP Amla Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
  { name: "HP Amla Oil (60ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 440 },
  { name: "HP Amla Reetha Sikakai Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 440 },
  { name: "HP Balsan Oil (1gm)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 550, selling_price: 1400 },
  { name: "HP Banafsha Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 170, selling_price: 340 },
  { name: "HP Banafsha Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 330, selling_price: 680 },
  { name: "HP Bitter Almond Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 450 },
  { name: "HP Bitter Almond Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 370, selling_price: 650 },
  { name: "HP Bitter Mustard Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 120, selling_price: 240 },
  { name: "HP Bitter Mustard Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 280, selling_price: 480 },
  { name: "HP Black Sesame oil (120 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 350, selling_price: 750 },
  { name: "HP Chamomile Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
  { name: "HP Chamomile Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 230, selling_price: 480 },
  { name: "HP Castor Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 80, selling_price: 120 },
  { name: "HP Castor Oil (60ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 120, selling_price: 240 },
  { name: "HP Cinnamon Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 120, selling_price: 240 },
  { name: "HP Clove Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 340 },
  { name: "HP Coriander Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 410, selling_price: 640 },
  { name: "HP Coriander Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
  { name: "HP Egg Oil (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 160, selling_price: 380 },
  { name: "HP Egg Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 320, selling_price: 740 },
  { name: "HP Eucalyptus Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 100, selling_price: 240 },
  { name: "HP Euclyptus Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 210, selling_price: 480 },
  { name: "HP Fennel Seeds Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 170, selling_price: 380 },
  { name: "HP Fennel Seeds Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 310, selling_price: 580 },
  { name: "HP Fenugreek Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
  { name: "HP Fenugreek Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 210, selling_price: 480 },
  { name: "HP Fish Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 120, selling_price: 300 },
  { name: "HP Fish Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 240, selling_price: 600 },
  { name: "HP Flax Seed Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 100, selling_price: 240 },
  { name: "HP Flax Seed Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 70, selling_price: 120 },
  { name: "HP Garlic Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 90, selling_price: 240 },
  { name: "HP Ginger Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 90, selling_price: 240 },
  { name: "HP Glycerine Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 120, selling_price: 240 },
  { name: "HP Jasmine Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
  { name: "HP Jasmine Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 230, selling_price: 480 },
  { name: "HP Jojoba Oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 280, selling_price: 680 },
  { name: "HP Kahu Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
  { name: "HP Kahu Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 480 },
  { name: "HP Kalonji Oil (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 210, selling_price: 340 },
  { name: "HP Kalonji Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 320, selling_price: 480 },
  { name: "HP Khashkhash Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 100, selling_price: 240 },
  { name: "HP Khashkhash Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 210, selling_price: 480 },
  { name: "HP Lavender Oil (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 170, selling_price: 240 },
  { name: "HP Lavender Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 320, selling_price: 480 },
  { name: "HP Lemon Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 350, selling_price: 600 },
  { name: "HP Maalkangni Oil ( 30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 450, selling_price: 800 },
  { name: "HP Maalkangni Oil ( 60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 430, selling_price: 800 },
  { name: "HP Mixed Melon Seed Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 170, selling_price: 240 },
  { name: "HP Mixed Melon seed Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 320, selling_price: 480 },
  { name: "HP Nabatati Oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 350, selling_price: 600 },
  { name: "HP Nabatati Talah Oil (10 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 700, selling_price: 1350 },
  { name: "HP Nagarmotha Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 90, selling_price: 240 },
  { name: "HP Nagarmotha Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 190, selling_price: 480 },
  { name: "HP Neem Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 190, selling_price: 300 },
  { name: "HP Neem Oil (60ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 360, selling_price: 600 },
  { name: "HP Nutmeg Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 160, selling_price: 300 },
  { name: "HP Olive Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 80, selling_price: 170 },
  { name: "HP Olive oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 170, selling_price: 340 },
  { name: "HP Orange Oil (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 320, selling_price: 650 },
  { name: "HP Peanut Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 170, selling_price: 300 },
  { name: "HP Peanut Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 350, selling_price: 600 },
  { name: "HP Peppermint Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 140, selling_price: 350 },
  { name: "HP Peppermint Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 280, selling_price: 700 },
  { name: "HP Pistachio Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 500, selling_price: 880 },
  { name: "HP Pistachio Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 750, selling_price: 1350 },
  { name: "HP Pumpkin Seed oil (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 350 },
  { name: "HP Pumpkin Seed oil (60ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 350, selling_price: 650 },
  { name: "HP Reetha Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
  { name: "HP Reetha Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 220 },
  { name: "HP Rose Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 0, selling_price: 0 },
  { name: "HP Rose Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 170, selling_price: 480 },
  { name: "HP Rosemary Oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 500, selling_price: 800 },
  { name: "HP Sandal Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 180, selling_price: 340 },
  { name: "HP Sandal Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 360, selling_price: 680 },
  { name: "HP Sikakai Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 70, selling_price: 120 },
  { name: "HP Sikakai Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 440 },
  { name: "HP Staff Tree Seed Oil (10 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 480 },
  { name: "HP Sweet Almond OIl (30ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 220, selling_price: 350 },
  { name: "HP Sweet Almond Oil (60ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 370, selling_price: 550 },
  { name: "HP Tea Tree Oil (10 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 210, selling_price: 400 },
  { name: "HP Tea Tree Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 400, selling_price: 800 },
  { name: "HP Ushna Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 320, selling_price: 550 },
  { name: "HP Walnut Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 210, selling_price: 480 },
  { name: "HP Walnut Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 430, selling_price: 960 },
  { name: "HP Wheat Oil (60 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 110, selling_price: 240 },
  { name: "MP Cinnamon Oil (60ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 230, selling_price: 480 },
  { name: "Mp Coconut Oil (1 Kg)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 1200, selling_price: 1800 },
  { name: "MP Coconut Oil (125 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 160, selling_price: 320 },
  { name: "Mp Coconut Oil (250 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 300, selling_price: 550 },
  { name: "Mp Coconut Oil (500 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 600, selling_price: 900 },
  { name: "MP Hair oil", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 290, selling_price: 550 },
  { name: "MP Hair Shampoo", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 290, selling_price: 550 },
  { name: "MP Mustard seed Oil (1 kg)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 560, selling_price: 1200 },
  { name: "MP Mustard Seed Oil (2 kg)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 560, selling_price: 2400 },
  { name: "MP Mustard Seed Oil (125 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 130, selling_price: 220 },
  { name: "MP Mustard Seed Oil (250 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 0, selling_price: 0 },
  { name: "Mp Mustard Seed Oil (500 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 600, selling_price: 600 },
  { name: "MP Onion Oil 120 (ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 550, selling_price: 800 },
  { name: "MP Pudina Oil 60 (ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 0, selling_price: 0 },
  { name: "MP Rosemary Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 720, selling_price: 1400 },
  { name: "MP Sesame Seed Oil (125 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 160, selling_price: 300 },
  { name: "MP Sesame Seed Oil (250 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 600, selling_price: 600 },
  { name: "MP Sesame Seed Oil (1 Kg)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 900, selling_price: 2400 },
  { name: "MP Sesame Seeds Oil (500 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 0, selling_price: 1200 },
  { name: "MP Tarpeen Oil (30 ml)", unit: "Pcs", category: "Essential Oils & Shampoo", purchase_rate: 0, selling_price: 0 },
];

// Helper function to generate slug from name
function generateSlug(name: string): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${name.toLowerCase().replace(/\s+/g, '-').replace(/[&,()]/g, '').replace(/--+/g, '-')}-${timestamp}`;
}

// Helper function to get or create entry
async function getOrCreateEntry(
  model: 'category' | 'unit' | 'tax' | 'supplier' | 'brand',
  name: string,
  codePrefix: string,
  tx?: any
): Promise<string> {
  const prismaClient = tx || prisma;
  const modelName = model as string;
  
  // Find existing
  const existing = await prismaClient[modelName].findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });

  if (existing) return existing.id;

  // Create new
  const code = `${codePrefix}-${Math.random().toString(36).substring(2, 9)}`;
  const createData: any = {
    name,
    code,
    is_active: true,
    display_on_pos: true,
  };

  if (model === 'tax') {
    createData.percentage = 0;
  }

  if (model === 'category') {
    createData.slug = generateSlug(name);
    createData.display_on_branches = [];
  }

  const created = await prismaClient[modelName].create({ data: createData });
  return created.id;
}

async function generateSKU(name: string): Promise<string> {
  const words = name.split(' ').slice(0, 3);
  const initials = words.map(w => w.charAt(0).toUpperCase()).join('');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${initials}${random}`;
}

async function seedEssentialOilsShampoo() {
  console.log('🌱 Starting Essential Oils & Shampoo seeder (Fast Mode)...\n');
  console.log(`📦 Processing ${products.length} products...\n`);

  const results = {
    success: [] as string[],
    failed: [] as { name: string; error: string }[],
  };

  // Pre-fetch all relations once
  const [category, units, lastProduct, unknownTax, unknownSupplier, unknownBrand] = await Promise.all([
    getOrCreateEntry('category', 'Essential Oils & Shampoo', 'CAT'),
    Promise.all([
      getOrCreateEntry('unit', 'Pcs', 'UNIT'),
    ]),
    prisma.product.findFirst({
      orderBy: { created_at: 'desc' },
      select: { code: true },
    }),
    getOrCreateEntry('tax', 'Unknown', 'TAX'),
    getOrCreateEntry('supplier', 'Unknown', 'SUP'),
    getOrCreateEntry('brand', 'Unknown', 'BRA'),
  ]);

  const unitMap = new Map<string, string>();
  for (const unitId of units) {
    const unit = await prisma.unit.findUnique({ where: { id: unitId }, select: { name: true } });
    if (unit) unitMap.set(unit.name.toLowerCase(), unitId);
  }

  let productCodeCounter = lastProduct ? parseInt(lastProduct.code) + 1 : 1000;

  // Process all products in a single transaction for speed
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        // Parse prices - handle "Default" and empty values as 0
        let purchaseRate = 0;
        const purchaseRateValue = product.purchase_rate;

        if (purchaseRateValue && purchaseRateValue !== '' && purchaseRateValue !== 'Default') {
          if (typeof purchaseRateValue === 'number') {
            purchaseRate = purchaseRateValue;
          } else if (typeof purchaseRateValue === 'string') {
            purchaseRate = parseFloat(purchaseRateValue) || 0;
          }
        }

        let sellingPrice = 0;
        const sellingPriceValue = product.selling_price;

        if (sellingPriceValue && sellingPriceValue !== '' && sellingPriceValue !== 0 && sellingPriceValue !== 'Default') {
          if (typeof sellingPriceValue === 'number') {
            sellingPrice = sellingPriceValue;
          } else if (typeof sellingPriceValue === 'string') {
            sellingPrice = parseFloat(sellingPriceValue) || 0;
          }
        }

        // Get unit ID
        const unitId = unitMap.get(product.unit.toLowerCase()) || units[0];

        // Check if product exists
        const existing = await tx.product.findFirst({
          where: { name: { equals: product.name, mode: 'insensitive' } },
          select: { id: true },
        });

        const productData = {
          name: product.name,
          unit_id: unitId,
          category_id: category,
          tax_id: unknownTax,
          supplier_id: unknownSupplier,
          brand_id: unknownBrand,
          purchase_rate: new Prisma.Decimal(purchaseRate),
          sales_rate_exc_dis_and_tax: new Prisma.Decimal(sellingPrice),
          sales_rate_inc_dis_and_tax: new Prisma.Decimal(sellingPrice),
          min_qty: 10,
          max_qty: 10,
          is_active: true,
          display_on_pos: true,
        };

        if (existing) {
          await tx.product.update({
            where: { id: existing.id },
            data: productData,
          });
        } else {
          const sku = await generateSKU(product.name);
          await tx.product.create({
            data: {
              ...productData,
              code: (productCodeCounter++).toString(),
              sku,
            },
          });
        }

        results.success.push(product.name);
      } catch (error) {
        const errorMessage = (error as Error).message;
        results.failed.push({ name: product.name, error: errorMessage });
      }
    }
  }, {
    maxWait: 60000,
    timeout: 60000,
  });

  console.log(`✅ Processed ${results.success.length} products`);

  console.log('\n📊 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   ✅ Successfully created/updated: ${results.success.length} products`);
  console.log(`   ❌ Failed: ${results.failed.length} products`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed products:');
    results.failed.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✅ Essential Oils & Shampoo seeder completed!');
}

// Run seeder
seedEssentialOilsShampoo()
  .then(() => {
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    return prisma.$disconnect().then(() => process.exit(1));
  });

