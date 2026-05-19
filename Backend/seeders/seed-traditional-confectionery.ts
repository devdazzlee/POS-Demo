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
  { name: "Almond Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 2670, selling_price: 4800 },
  { name: "Black Sesame Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 900, selling_price: 1600 },
  { name: "Cashew Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 3270, selling_price: 4800 },
  { name: "Chickpeas Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 790, selling_price: 1200 },
  { name: "Coconut Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 1150, selling_price: 1600 },
  { name: "Flat Gajak", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 650, selling_price: 1200 },
  { name: "Flax Seeds Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 500, selling_price: 2000 },
  { name: "Gajak Roll Box", unit: "Pcs", category: "Traditional Confectionery", purchase_rate: 650, selling_price: 700 },
  { name: "Mixed Nuts Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 3870, selling_price: 5600 },
  { name: "Peanut Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 900, selling_price: 1200 },
  { name: "Pehalwan Reawri (250gms)", unit: "Pcs", category: "Traditional Confectionery", purchase_rate: 600, selling_price: 280 },
  { name: "Pehalwan Reawri (500gms)", unit: "Pcs", category: "Traditional Confectionery", purchase_rate: 600, selling_price: 560 },
  { name: "Pistachio Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 5000, selling_price: 8000 },
  { name: "Puffed Rice Balls", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 80, selling_price: 150 },
  { name: "Puffed Rice Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 185, selling_price: 300 },
  { name: "Reawri", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 350, selling_price: 1200 },
  { name: "Roti Gajak", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 650, selling_price: 1200 },
  { name: "Round Gajak", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 650, selling_price: 1200 },
  { name: "Sesame Balls (Small)", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 650, selling_price: 300 },
  { name: "Sesame Chikki", unit: "Kgs", category: "Traditional Confectionery", purchase_rate: 400, selling_price: 1200 },
];

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

  const created = await prismaClient[modelName].create({ data: createData });
  return created.id;
}

async function generateSKU(name: string): Promise<string> {
  const words = name.split(' ').slice(0, 3);
  const initials = words.map(w => w.charAt(0).toUpperCase()).join('');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${initials}${random}`;
}

async function seedTraditionalConfectionery() {
  console.log('🌱 Starting Traditional Confectionery seeder (Fast Mode)...\n');
  console.log(`📦 Processing ${products.length} products...\n`);

  const results = {
    success: [] as string[],
    failed: [] as { name: string; error: string }[],
  };

  // Pre-fetch all relations once
  const [category, units, lastProduct, unknownTax, unknownSupplier, unknownBrand] = await Promise.all([
    getOrCreateEntry('category', 'Traditional Confectionery', 'CAT'),
    Promise.all([
      getOrCreateEntry('unit', 'Kgs', 'UNIT'),
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
  console.log('\n✅ Traditional Confectionery seeder completed!');
}

// Run seeder
seedTraditionalConfectionery()
  .then(() => {
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    return prisma.$disconnect().then(() => process.exit(1));
  });

