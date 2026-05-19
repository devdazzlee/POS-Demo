import { prisma } from '../src/prisma/client';
import * as dotenv from 'dotenv';
import { Prisma } from '@prisma/client';

dotenv.config();

interface ProductInput {
  name: string;
  unit: string;
  category: string;
  purchase_rate: number;
  selling_price: number;
}

const products: ProductInput[] = [
  { name: 'Studio Condenser Microphone', unit: 'Pcs', category: 'Studio Equipment', purchase_rate: 6500, selling_price: 12000 },
  { name: '18" LED Ring Light', unit: 'Pcs', category: 'Studio Equipment', purchase_rate: 4200, selling_price: 7500 },
  { name: 'Adjustable Tripod Stand', unit: 'Pcs', category: 'Studio Equipment', purchase_rate: 3000, selling_price: 5500 },
  { name: 'Green Screen Backdrop 2x3m', unit: 'Pcs', category: 'Studio Equipment', purchase_rate: 2200, selling_price: 4000 },
  { name: 'Boom Arm Microphone Stand', unit: 'Pcs', category: 'Studio Equipment', purchase_rate: 1800, selling_price: 3500 },
  { name: 'HD 1080p Webcam', unit: 'Pcs', category: 'Electronics', purchase_rate: 3800, selling_price: 6800 },
  { name: 'Wireless Bluetooth Earbuds', unit: 'Pcs', category: 'Electronics', purchase_rate: 2500, selling_price: 4500 },
  { name: 'Power Bank 20000mAh', unit: 'Pcs', category: 'Electronics', purchase_rate: 2800, selling_price: 4900 },
  { name: 'USB-C Cable 2m Braided', unit: 'Pcs', category: 'Electronics', purchase_rate: 350, selling_price: 750 },
  { name: '4K HDMI Cable 3m', unit: 'Pcs', category: 'Electronics', purchase_rate: 600, selling_price: 1200 },
  { name: 'SD Card 128GB Class 10', unit: 'Pcs', category: 'Electronics', purchase_rate: 1800, selling_price: 3200 },
  { name: 'Mechanical Gaming Keyboard', unit: 'Pcs', category: 'Electronics', purchase_rate: 5500, selling_price: 9800 },
  { name: 'RGB Gaming Mouse', unit: 'Pcs', category: 'Electronics', purchase_rate: 1600, selling_price: 2900 },
  { name: 'Portable Bluetooth Speaker', unit: 'Pcs', category: 'Electronics', purchase_rate: 3200, selling_price: 5800 },
  { name: 'Laptop Cooling Pad', unit: 'Pcs', category: 'Electronics', purchase_rate: 1400, selling_price: 2600 },
];

function generateSlug(name: string): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${name.toLowerCase().replace(/\s+/g, '-').replace(/[&,()"]/g, '').replace(/--+/g, '-')}-${timestamp}`;
}

async function getOrCreateEntry(
  model: 'category' | 'unit' | 'tax' | 'supplier' | 'brand',
  name: string,
  codePrefix: string,
  tx?: any
): Promise<string> {
  const prismaClient = tx || prisma;
  const modelName = model as string;

  const existing = await prismaClient[modelName].findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });

  if (existing) return existing.id;

  const code = `${codePrefix}-${Math.random().toString(36).substring(2, 9)}`;
  const createData: any = {
    name,
    code,
    is_active: true,
    display_on_pos: true,
  };

  if (model === 'tax') createData.percentage = 0;
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
  return `ACE${initials}${random}`;
}

async function seedAceProducts() {
  console.log('Seeding ACE STUDIOS products...\n');
  console.log(`Processing ${products.length} products...\n`);

  const results = {
    success: [] as string[],
    failed: [] as { name: string; error: string }[],
  };

  const uniqueCategories = Array.from(new Set(products.map(p => p.category)));
  const uniqueUnits = Array.from(new Set(products.map(p => p.unit)));

  const [categoryIds, unitIds, lastProduct, unknownTax, unknownSupplier, aceBrand] = await Promise.all([
    Promise.all(uniqueCategories.map(c => getOrCreateEntry('category', c, 'CAT'))),
    Promise.all(uniqueUnits.map(u => getOrCreateEntry('unit', u, 'UNIT'))),
    prisma.product.findFirst({ orderBy: { created_at: 'desc' }, select: { code: true } }),
    getOrCreateEntry('tax', 'Unknown', 'TAX'),
    getOrCreateEntry('supplier', 'Unknown', 'SUP'),
    getOrCreateEntry('brand', 'ACE STUDIOS', 'BRA'),
  ]);

  const categoryMap = new Map<string, string>();
  uniqueCategories.forEach((c, i) => categoryMap.set(c, categoryIds[i]));

  const unitMap = new Map<string, string>();
  uniqueUnits.forEach((u, i) => unitMap.set(u.toLowerCase(), unitIds[i]));

  let productCodeCounter = lastProduct ? parseInt(lastProduct.code) + 1 : 2000;
  if (isNaN(productCodeCounter)) productCodeCounter = 2000;

  await prisma.$transaction(async (tx) => {
    for (const product of products) {
      try {
        const unitId = unitMap.get(product.unit.toLowerCase()) || unitIds[0];
        const categoryId = categoryMap.get(product.category) || categoryIds[0];

        const existing = await tx.product.findFirst({
          where: { name: { equals: product.name, mode: 'insensitive' } },
          select: { id: true },
        });

        const productData = {
          name: product.name,
          unit_id: unitId,
          category_id: categoryId,
          tax_id: unknownTax,
          supplier_id: unknownSupplier,
          brand_id: aceBrand,
          purchase_rate: new Prisma.Decimal(product.purchase_rate),
          sales_rate_exc_dis_and_tax: new Prisma.Decimal(product.selling_price),
          sales_rate_inc_dis_and_tax: new Prisma.Decimal(product.selling_price),
          min_qty: 5,
          max_qty: 50,
          is_active: true,
          display_on_pos: true,
        };

        if (existing) {
          await tx.product.update({ where: { id: existing.id }, data: productData });
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
        console.log(`  ${product.name}`);
      } catch (error) {
        results.failed.push({ name: product.name, error: (error as Error).message });
      }
    }
  }, { maxWait: 60000, timeout: 60000 });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Created/updated: ${results.success.length} products`);
  console.log(`Failed: ${results.failed.length}`);
  if (results.failed.length > 0) {
    results.failed.forEach(({ name, error }) => console.log(`  ${name}: ${error}`));
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

seedAceProducts()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('Fatal error:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
