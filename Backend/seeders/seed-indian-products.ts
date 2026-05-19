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
  { name: "Axe Brand Abu Fass", unit: "Pcs", category: "Indian Products", purchase_rate: 180, selling_price: 300 },
  { name: "B-Tex Balm", unit: "Pcs", category: "Indian Products", purchase_rate: 220, selling_price: 380 },
  { name: "Baba Elaichi (10 gms)", unit: "Pcs", category: "Indian Products", purchase_rate: 550, selling_price: 850 },
  { name: "Budhia Surma", unit: "Pcs", category: "Indian Products", purchase_rate: 80, selling_price: 150 },
  { name: "Chandrika Soap", unit: "Pcs", category: "Indian Products", purchase_rate: 400, selling_price: 650 },
  { name: "Crack Cream", unit: "Pcs", category: "Indian Products", purchase_rate: 220, selling_price: 480 },
  { name: "Dabur Red Toothpaste (L)", unit: "Pcs", category: "Indian Products", purchase_rate: 550, selling_price: 800 },
  { name: "Hajmola", unit: "Pcs", category: "Indian Products", purchase_rate: 750, selling_price: 1200 },
  { name: "Hawaban Tablet", unit: "Pcs", category: "Indian Products", purchase_rate: 180, selling_price: 400 },
  { name: "Indulekha Oil (100 ml)", unit: "Pcs", category: "Indian Products", purchase_rate: 800, selling_price: 1600 },
  { name: "Iodex", unit: "Pcs", category: "Indian Products", purchase_rate: 280, selling_price: 480 },
  { name: "Itch Guard", unit: "Pcs", category: "Indian Products", purchase_rate: 250, selling_price: 450 },
  { name: "Jivan Mixture (60 ml)", unit: "Pcs", category: "Indian Products", purchase_rate: 450, selling_price: 900 },
  { name: "Kajal", unit: "Pcs", category: "Indian Products", purchase_rate: 90, selling_price: 150 },
  { name: "Kayam Churna", unit: "Pcs", category: "Indian Products", purchase_rate: 600, selling_price: 950 },
  { name: "Kayam Tablet", unit: "Pcs", category: "Indian Products", purchase_rate: 450, selling_price: 800 },
  { name: "Lookman e Hayat Oil (100 ml)", unit: "Pcs", category: "Indian Products", purchase_rate: 550, selling_price: 850 },
  { name: "Moov Cream", unit: "Pcs", category: "Indian Products", purchase_rate: 270, selling_price: 450 },
  { name: "Mysore Sandal Soap Large", unit: "Pcs", category: "Indian Products", purchase_rate: 650, selling_price: 900 },
  { name: "Navratna Oil (200 ml)", unit: "Pcs", category: "Indian Products", purchase_rate: 500, selling_price: 950 },
  { name: "Nurament Oil (50 ml)", unit: "Pcs", category: "Indian Products", purchase_rate: 400, selling_price: 750 },
  { name: "Parachute Oil (100 ml)", unit: "Pcs", category: "Indian Products", purchase_rate: 450, selling_price: 700 },
  { name: "Pudin Hara Drops", unit: "Pcs", category: "Indian Products", purchase_rate: 380, selling_price: 600 },
  { name: "Pudin Hara Tablets", unit: "Pcs", category: "Indian Products", purchase_rate: 260, selling_price: 350 },
  { name: "Rajnigandha Silver Pearls", unit: "Pcs", category: "Indian Products", purchase_rate: 600, selling_price: 950 },
  { name: "Sandal Soap No. 1", unit: "Pcs", category: "Indian Products", purchase_rate: 300, selling_price: 480 },
  { name: "Sudarshan Churan (30 gm)", unit: "Pcs", category: "Indian Products", purchase_rate: 350, selling_price: 600 },
  { name: "Tiger Balm Red", unit: "Pcs", category: "Indian Products", purchase_rate: 550, selling_price: 850 },
  { name: "Tiger Balm White", unit: "Pcs", category: "Indian Products", purchase_rate: 550, selling_price: 850 },
  { name: "Vicco Manjan (50 gms)", unit: "Pcs", category: "Indian Products", purchase_rate: 380, selling_price: 600 },
  { name: "Vicco Turmeric (m)", unit: "Pcs", category: "Indian Products", purchase_rate: 400, selling_price: 650 },
  { name: "Zandu Ultra Power", unit: "Pcs", category: "Indian Products", purchase_rate: 400, selling_price: 650 },
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

async function seedIndianProducts() {
  console.log('🌱 Starting Indian Products seeder (Fast Mode)...\n');
  console.log(`📦 Processing ${products.length} products...\n`);

  const results = {
    success: [] as string[],
    failed: [] as { name: string; error: string }[],
  };

  // Pre-fetch all relations once
  const [category, units, lastProduct, unknownTax, unknownSupplier, unknownBrand] = await Promise.all([
    getOrCreateEntry('category', 'Indian Products', 'CAT'),
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
  console.log('\n✅ Indian Products seeder completed!');
}

// Run seeder
seedIndianProducts()
  .then(() => {
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    return prisma.$disconnect().then(() => process.exit(1));
  });


