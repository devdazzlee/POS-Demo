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
  { name: "Anmol Rice", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 0, selling_price: 0 },
  { name: "Barley (Jaww)", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 200, selling_price: 320 },
  { name: "Black Chickpeas (Kaala Chana)", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 280, selling_price: 500 },
  { name: "Daal Arhar", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 640, selling_price: 880 },
  { name: "Daal Haleem Mix", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 250, selling_price: 600 },
  { name: "Daal Maash", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 470, selling_price: 680 },
  { name: "Daal Maash Chilka", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 440, selling_price: 560 },
  { name: "Daal Maash Sabut", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 420, selling_price: 680 },
  { name: "Daal Mix", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 250, selling_price: 600 },
  { name: "Daal Moong", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 405, selling_price: 480 },
  { name: "Daal Moong Chilka", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 380, selling_price: 480 },
  { name: "Daal Moong Sabut", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 400, selling_price: 480 },
  { name: "Gandum Daliya Bareeq", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 180, selling_price: 320 },
  { name: "Gandum Daliya Mota", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 180, selling_price: 320 },
  { name: "Jasmine Rice", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 0, selling_price: 0 },
  { name: "Jaww Ka Daliya", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 230, selling_price: 400 },
  { name: "Kaali Masoor", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 270, selling_price: 480 },
  { name: "Kangni", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 250, selling_price: 340 },
  { name: "Kidney Beans (Red)", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 640, selling_price: 800 },
  { name: "Lal Masoor", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 295, selling_price: 480 },
  { name: "Millets (Bajra)", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 125, selling_price: 160 },
  { name: "Mixed Dana", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 0, selling_price: 0 },
  { name: "Mughal Rice", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 0, selling_price: 0 },
  { name: "Red Rice", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 220, selling_price: 380 },
  { name: "Roasted Chickpeas", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 600, selling_price: 1000 },
  { name: "Roasted Chickpeas (W/o Skin)", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 700, selling_price: 1100 },
  { name: "Sella Rice", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 340, selling_price: 450 },
  { name: "Soya Bean", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 480, selling_price: 1000 },
  { name: "Split Chickpeas (Channay Ki Daal)", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 290, selling_price: 540 },
  { name: "Star Rice", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 220, selling_price: 350 },
  { name: "Super Kernel Basmati", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 355, selling_price: 450 },
  { name: "Taj Mehal rice", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 355, selling_price: 450 },
  { name: "Ujala Rice", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 0, selling_price: 0 },
  { name: "Wheat", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 150, selling_price: 240 },
  { name: "White Beans", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 400, selling_price: 700 },
  { name: "White Chickpeas (Large)", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 480, selling_price: 680 },
  { name: "White Chickpeas (small)", unit: "Kgs", category: "Grains, Pulses & Rice", purchase_rate: 320, selling_price: 480 },
];

// Helper function to generate slug from name
function generateSlug(name: string): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${name.toLowerCase().replace(/\s+/g, '-').replace(/[&,]/g, '').replace(/--+/g, '-')}-${timestamp}`;
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

async function seedGrainsPulsesRice() {
  console.log('🌱 Starting Grains, Pulses & Rice seeder (Fast Mode)...\n');
  console.log(`📦 Processing ${products.length} products...\n`);

  const results = {
    success: [] as string[],
    failed: [] as { name: string; error: string }[],
  };

  // Pre-fetch all relations once
  const [category, units, lastProduct, unknownTax, unknownSupplier, unknownBrand] = await Promise.all([
    getOrCreateEntry('category', 'Grains, Pulses & Rice', 'CAT'),
    Promise.all([
      getOrCreateEntry('unit', 'Kgs', 'UNIT'),
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
        // Parse prices
        let purchaseRate = 0;
        if (product.purchase_rate && product.purchase_rate !== '' && product.purchase_rate !== 'Default') {
          purchaseRate = typeof product.purchase_rate === 'number' 
            ? product.purchase_rate 
            : parseFloat(product.purchase_rate) || 0;
        }

        let sellingPrice = 0;
        if (product.selling_price && product.selling_price !== '' && product.selling_price !== 0) {
          sellingPrice = typeof product.selling_price === 'number'
            ? product.selling_price
            : parseFloat(product.selling_price) || 0;
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
    maxWait: 30000,
    timeout: 30000,
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
  console.log('\n✅ Grains, Pulses & Rice seeder completed!');
}

// Run seeder
seedGrainsPulsesRice()
  .then(() => {
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    return prisma.$disconnect().then(() => process.exit(1));
  });

