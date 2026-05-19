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
  { name: "2 Piece Betel Nut", unit: "Kgs", category: "General", purchase_rate: 1800, selling_price: 4000 },
  { name: "Baryan", unit: "Pcs", category: "General", purchase_rate: 57.58, selling_price: 150 },
  { name: "Batashay", unit: "Kgs", category: "General", purchase_rate: 250, selling_price: 1000 },
  { name: "Brown Sugar", unit: "Kgs", category: "General", purchase_rate: 200, selling_price: 360 },
  { name: "China Grass (Whole)", unit: "Pcs", category: "General", purchase_rate: 35, selling_price: 80 },
  { name: "China Grass Large (Grounded)", unit: "Pcs", category: "General", purchase_rate: 55, selling_price: 100 },
  { name: "China Grass Small (Grounded)", unit: "Pcs", category: "General", purchase_rate: 35, selling_price: 80 },
  { name: "Dahi Mirch", unit: "Pcs", category: "General", purchase_rate: 200, selling_price: 250 },
  { name: "Desi Ghee", unit: "Kgs", category: "General", purchase_rate: 900, selling_price: 1800 },
  { name: "Dhala Misri", unit: "Kgs", category: "General", purchase_rate: 250, selling_price: 800 },
  { name: "Dhanya giri", unit: "Kgs", category: "General", purchase_rate: 1120, selling_price: 1800 },
  { name: "Essence", unit: "Pcs", category: "General", purchase_rate: 50, selling_price: 80 },
  { name: "Fennel Seeds (Sweet)", unit: "Kgs", category: "General", purchase_rate: 280, selling_price: 600 },
  { name: "Fine Coal", unit: "Pcs", category: "General", purchase_rate: 60, selling_price: 150 },
  { name: "Flavoured Silli Betel Nut", unit: "Kgs", category: "General", purchase_rate: 3400, selling_price: 6000 },
  { name: "Flavoured Sunny Betel Nut", unit: "Kgs", category: "General", purchase_rate: 3400, selling_price: 6000 },
  { name: "Food Colour", unit: "Pcs", category: "General", purchase_rate: 5, selling_price: 40 },
  { name: "ghuriyan", unit: "Kgs", category: "General", purchase_rate: 500, selling_price: 800 },
  { name: "Glass Gurr", unit: "Pcs", category: "General", purchase_rate: 85, selling_price: 140 },
  { name: "Jaggery (Gurr)", unit: "Kgs", category: "General", purchase_rate: 220, selling_price: 360 },
  { name: "Jaggery (Kala Gurr)", unit: "Kgs", category: "General", purchase_rate: 250, selling_price: 380 },
  { name: "Kaccha Chewra (Pawa)", unit: "Kgs", category: "General", purchase_rate: 320, selling_price: 600 },
  { name: "Key Kewra Water (300ml)", unit: "Pcs", category: "General", purchase_rate: 80, selling_price: 120 },
  { name: "khushboo dana", unit: "Kgs", category: "General", purchase_rate: 480, selling_price: 800 },
  { name: "Laccha", unit: "Pcs", category: "General", purchase_rate: 90, selling_price: 200 },
  { name: "Mango Slice", unit: "Pcs", category: "General", purchase_rate: 70, selling_price: 140 },
  { name: "Misri", unit: "Kgs", category: "General", purchase_rate: 340, selling_price: 800 },
  { name: "MIx Sweets", unit: "Pcs", category: "General", purchase_rate: 0, selling_price: 1600 },
  { name: "MP Chat Hazam Chooran", unit: "Pcs", category: "General", purchase_rate: 80, selling_price: 150 },
  { name: "Naqqul (large)", unit: "Kgs", category: "General", purchase_rate: 220, selling_price: 400 },
  { name: "Naqqul (small)", unit: "Kgs", category: "General", purchase_rate: 220, selling_price: 400 },
  { name: "Popcorn", unit: "Kgs", category: "General", purchase_rate: 320, selling_price: 700 },
  { name: "Puffed Rice (Murmuray)", unit: "Kgs", category: "General", purchase_rate: 320, selling_price: 600 },
  { name: "Red Anmol Betel Nut", unit: "Kgs", category: "General", purchase_rate: 540, selling_price: 800 },
  { name: "Rita Tamarind (M)", unit: "Pcs", category: "General", purchase_rate: 11.67, selling_price: 40 },
  { name: "Roasted Paan Masala", unit: "Kgs", category: "General", purchase_rate: 1250, selling_price: 1800 },
  { name: "Saffron (0.5gms)", unit: "Pcs", category: "General", purchase_rate: 290, selling_price: 1000 },
  { name: "Saghu Dana", unit: "Kgs", category: "General", purchase_rate: 300, selling_price: 800 },
  { name: "Silli Betel Nut", unit: "Kgs", category: "General", purchase_rate: 3200, selling_price: 4000 },
  { name: "Silver Ball", unit: "Kgs", category: "General", purchase_rate: 380, selling_price: 800 },
  { name: "Silver Warq (5)", unit: "Pcs", category: "General", purchase_rate: 12.5, selling_price: 100 },
  { name: "Siwayyan", unit: "Pcs", category: "General", purchase_rate: 38.33, selling_price: 80 },
  { name: "Sliced Betel Nut", unit: "Kgs", category: "General", purchase_rate: 1400, selling_price: 4000 },
  { name: "Star & Polo Mix", unit: "Kgs", category: "General", purchase_rate: 300, selling_price: 800 },
  { name: "Sunflower seeds", unit: "Kgs", category: "General", purchase_rate: 360, selling_price: 480 },
  { name: "Sunflower Seeds (Roasted)", unit: "Kgs", category: "General", purchase_rate: 550, selling_price: 1400 },
  { name: "Sunflower Seeds W/O Shell", unit: "Kgs", category: "General", purchase_rate: 800, selling_price: 3600 },
  { name: "Sunny Betel Nut", unit: "Kgs", category: "General", purchase_rate: 3200, selling_price: 4000 },
  { name: "Sweet Paan Masala", unit: "Kgs", category: "General", purchase_rate: 700, selling_price: 1400 },
  { name: "Sweet Soda Powder", unit: "Kgs", category: "General", purchase_rate: 140, selling_price: 400 },
  { name: "Vanilla Essence", unit: "Pcs", category: "General", purchase_rate: 50, selling_price: 80 },
  { name: "Zafrani Essence", unit: "Pcs", category: "General", purchase_rate: 50, selling_price: 80 },
  { name: "Zafrani Kewra (300 ml)", unit: "Pcs", category: "General", purchase_rate: 75, selling_price: 120 },
  { name: "Zarda food colour", unit: "Kgs", category: "General", purchase_rate: 560, selling_price: 1600 },
  { name: "Key Synthetic Vinegar (750 ml)", unit: "Pcs", category: "General", purchase_rate: 110, selling_price: 190 },
  { name: "Saffron ( 1 gm ) dibya", unit: "Kgs", category: "General", purchase_rate: 300, selling_price: 1400 },
  { name: "Key Synthetic Vinegar (300 ml)", unit: "Pcs", category: "General", purchase_rate: 70, selling_price: 120 },
  { name: "Green Cardamom (whole) (Eliche) ( AKBER )", unit: "Kgs", category: "General", purchase_rate: 14000, selling_price: 20000 },
  { name: "Fried Onion ( 500 GM )", unit: "Pcs", category: "General", purchase_rate: 0, selling_price: 285 },
  { name: "Ginger Gurr", unit: "Kgs", category: "General", purchase_rate: 0, selling_price: 450 },
  { name: "CHANNA CHIKKI 250 GM", unit: "Kgs", category: "General", purchase_rate: 0, selling_price: 0 },
  { name: "Murmuray Chikki", unit: "Pcs", category: "General", purchase_rate: 0, selling_price: 0 },
  { name: "Empty Murabba bottles", unit: "Pcs", category: "General", purchase_rate: 0, selling_price: 800 },
  { name: "EMPTY FOOD COLOR DIBYA", unit: "Pcs", category: "General", purchase_rate: 0, selling_price: 4000 },
  { name: "Shilajit .10 gm", unit: "Pcs", category: "General", purchase_rate: 0, selling_price: 340 },
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

async function seedGeneral() {
  console.log('🌱 Starting General seeder (Fast Mode)...\n');
  console.log(`📦 Processing ${products.length} products...\n`);

  const results = {
    success: [] as string[],
    failed: [] as { name: string; error: string }[],
  };

  // Pre-fetch all relations once
  const [category, units, lastProduct, unknownTax, unknownSupplier, unknownBrand] = await Promise.all([
    getOrCreateEntry('category', 'General', 'CAT'),
    Promise.all([
      getOrCreateEntry('unit', 'Pcs', 'UNIT'),
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
  console.log('\n✅ General seeder completed!');
}

// Run seeder
seedGeneral()
  .then(() => {
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    return prisma.$disconnect().then(() => process.exit(1));
  });


