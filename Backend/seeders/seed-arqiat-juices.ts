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
  { name: "AB Icecream Soda", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
  { name: "AB Pineapple Sharbat", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
  { name: "Ab Sharbat e Anaar", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
  { name: "AB Sharbat e Blueberry", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
  { name: "AB Sharbat e Gulab", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
  { name: "AB Sharbat e Lychee", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
  { name: "AB Sharbat e Mango", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
  { name: "AB Sharbat e Orange", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
  { name: "AB Sharbat e Peach", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
  { name: "AB Sharbat e Sandal", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 350, selling_price: 400 },
  { name: "AQ Arq Dasmol", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 220, selling_price: 340 },
  { name: "AQ Arq e Ajwain", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 160, selling_price: 240 },
  { name: "AQ Arq e Badian", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 160, selling_price: 240 },
  { name: "AQ Arq e Gaozban", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 160, selling_price: 240 },
  { name: "AQ Arq e Gulab", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 120, selling_price: 250 },
  { name: "AQ Arq e Gulab Spray", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 100, selling_price: 150 },
  { name: "AQ Arq e Kasni", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 160, selling_price: 240 },
  { name: "AQ Arq e Makoh", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 160, selling_price: 240 },
  { name: "AQ Arq Mehzal", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 220, selling_price: 450 },
  { name: "AQ Arq Poudina", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 160, selling_price: 240 },
  { name: "AQ Chaw Arqa", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 160, selling_price: 240 },
  { name: "AQ Jam e Shifa (250ml)", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 150, selling_price: 300 },
  { name: "AQ Jam e Shifa (800ml)", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 450, selling_price: 700 },
  { name: "AQ Sharbat e Anjbar", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 250, selling_price: 350 },
  { name: "AQ Sharbat e Badam", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 280, selling_price: 480 },
  { name: "AQ Sharbat e Elaichi", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 250, selling_price: 350 },
  { name: "AQ Sharbat e Unaab", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 250, selling_price: 440 },
  { name: "AQ Sharbat Pomegranate (Anar)", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 320, selling_price: 470 },
  { name: "AQ Sharbat Sandal", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 320, selling_price: 490 },
  { name: "AQ Sharbat Tamarind & Prunes", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 320, selling_price: 440 },
  { name: "Aqua Slim", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 0, selling_price: 0 },
  { name: "Arq e Makoh (Marhaba)", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 0, selling_price: 0 },
  { name: "Arq Nana", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 66.67, selling_price: 200 },
  { name: "Dittus Apple Vinegar", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 480, selling_price: 550 },
  { name: "Dittus Grape Vinegar", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 480, selling_price: 550 },
  { name: "Jaman Vinegar", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 280, selling_price: 400 },
  { name: "MP Arq Gulab ( 800 ml )", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 63, selling_price: 250 },
  { name: "Rooh Kewra ( 800 ML )", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 100, selling_price: 250 },
  { name: "Rooh Kewra 300 ml", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 0, selling_price: 120 },
  { name: "Sharbat E Bazoori", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 320, selling_price: 490 },
  { name: "Sharbat e Roohafza (Hamdard)", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 0, selling_price: 0 },
  { name: "Thadal", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 550, selling_price: 600 },
  { name: "Zafrani Kewra ( 800 ML )", unit: "Pcs", category: "Arqiat & Juices", purchase_rate: 100, selling_price: 250 },
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

async function seedArqiatJuices() {
  console.log('🌱 Starting Arqiat & Juices seeder (Fast Mode)...\n');
  console.log(`📦 Processing ${products.length} products...\n`);

  const results = {
    success: [] as string[],
    failed: [] as { name: string; error: string }[],
  };

  // Pre-fetch all relations once
  const [category, units, lastProduct, unknownTax, unknownSupplier, unknownBrand] = await Promise.all([
    getOrCreateEntry('category', 'Arqiat & Juices', 'CAT'),
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
  console.log('\n✅ Arqiat & Juices seeder completed!');
}

// Run seeder
seedArqiatJuices()
  .then(() => {
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    return prisma.$disconnect().then(() => process.exit(1));
  });


