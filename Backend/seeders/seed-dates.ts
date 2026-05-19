import { prisma } from '../src/prisma/client';
import { Prisma } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'djadwzfwg',
  api_key: '199548153713428',
  api_secret: 'gdhzagnXsXDYGrVyEx8qjzzYktY',
});

const IMAGES_DIR = path.resolve(__dirname, '../seeder_images/dates');
const CATEGORY_IMAGE = 'maincategory dates.PNG';

interface ProductInput {
  name: string;
  unit: string;
  category: string;
  purchase_rate?: number | string;
  selling_price: number | string;
  image?: string; // local image filename
}

const products: ProductInput[] = [
  { name: "Ajwa Dates", unit: "Kgs", category: "Dates", selling_price: 5200, image: "Ajwa Dates.jpg" },
  { name: "Irani Dates (500gms Box)", unit: "Pcs", category: "Dates", selling_price: 550, image: "Irani Dates (500gms Box).jpg" },
  { name: "Kalmi Dates", unit: "Kgs", category: "Dates", selling_price: 3800, image: "Kalmi Dates.jpg" },
  { name: "Mabroom Dates", unit: "Kgs", category: "Dates", selling_price: 4800, image: "Mabroom Dates.jpg" },
  { name: "Punjgor Dates", unit: "Kgs", category: "Dates", selling_price: 1200, image: "Punjgor Dates.jpg" },
  { name: "Sugai Dates", unit: "Kgs", category: "Dates", selling_price: 5800, image: "Sugai Dates.jpg" },
  { name: "Ajwa Powder", unit: "Pcs", category: "Dates", selling_price: 1200, image: "Ajwa Powder.jpg" },
  { name: "Ajwa Paste", unit: "Pcs", category: "Dates", selling_price: 1500, image: "Ajwa Paste.jpg" },
  { name: "Amber Dates", unit: "Kgs", category: "Dates", selling_price: 5800, image: "Amber Dates.jpg" },
  { name: "Zahidi Dates", unit: "Kgs", category: "Dates", selling_price: 1400, image: "Zahidi Dates.jpg" },
  { name: "Rabbai Dates", unit: "Kgs", category: "Dates", selling_price: 1800, image: "Rabbai Dates.jpg" },
  { name: "Sukkari Dates", unit: "Kgs", category: "Dates", selling_price: 3800, image: "Sukkari Dates.jpg" },
  { name: "Medjool Dates", unit: "Kgs", category: "Dates", selling_price: 6000, image: "Medjool Dates.jpg" },
];

// Helper: upload image to Cloudinary
async function uploadToCloudinary(filePath: string, name: string, folder: string = 'manpasand/products'): Promise<string> {
  const publicId = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        public_id: publicId,
        folder,
        overwrite: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result?.secure_url || '');
        }
      }
    );
  });
}

// Helper: find image file with case-insensitive matching
function findImageFile(imageFilename: string): string | null {
  // Try exact match first
  const exactPath = path.join(IMAGES_DIR, imageFilename);
  if (fs.existsSync(exactPath)) {
    return exactPath;
  }

  // Try case-insensitive match by scanning directory
  try {
    const files = fs.readdirSync(IMAGES_DIR);
    const lowerTarget = imageFilename.toLowerCase();
    const match = files.find(f => f.toLowerCase() === lowerTarget);
    if (match) {
      return path.join(IMAGES_DIR, match);
    }
  } catch (e) {
    // Directory not found
  }

  return null;
}

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

async function seedDates() {
  console.log('🌱 Starting Dates seeder (with images)...\n');

  const results = {
    success: [] as string[],
    failed: [] as { name: string; error: string }[],
    imagesUploaded: 0,
    imagesFailed: 0,
  };

  // Check if images directory exists
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ Images directory not found: ${IMAGES_DIR}`);
    console.log('   Continuing without images...\n');
  } else {
    const imageFiles = fs.readdirSync(IMAGES_DIR).filter(f => !f.startsWith('.'));
    console.log(`📸 Found ${imageFiles.length} images in ${IMAGES_DIR}\n`);
  }

  console.log(`📦 Processing ${products.length} products...\n`);

  // Pre-fetch all relations once
  const [categoryId, units, lastProduct, unknownTax, unknownSupplier, unknownBrand] = await Promise.all([
    getOrCreateEntry('category', 'Dates', 'CAT'),
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

  console.log(`✅ Category "Dates" ready (ID: ${categoryId})`);

  // Upload category image
  if (fs.existsSync(IMAGES_DIR)) {
    const categoryImagePath = findImageFile(CATEGORY_IMAGE);
    if (categoryImagePath) {
      try {
        console.log(`📤 Uploading category image...`);
        const cloudinaryUrl = await uploadToCloudinary(categoryImagePath, 'dates_category', 'manpasand/categories');

        // Update category image field
        await prisma.category.update({
          where: { id: categoryId },
          data: { image: cloudinaryUrl },
        });

        // Also create a CategoryImages record
        const existingCategoryImage = await prisma.categoryImages.findFirst({
          where: { category_id: categoryId },
        });

        if (!existingCategoryImage) {
          await prisma.categoryImages.create({
            data: {
              category_id: categoryId,
              image: cloudinaryUrl,
              status: 'COMPLETE',
              is_active: true,
            },
          });
        } else {
          await prisma.categoryImages.update({
            where: { id: existingCategoryImage.id },
            data: { image: cloudinaryUrl },
          });
        }

        console.log(`✅ Category image uploaded: ${cloudinaryUrl}\n`);
      } catch (error) {
        console.error(`❌ Category image upload failed: ${(error as Error).message}\n`);
      }
    } else {
      console.log(`⚠️  Category image not found: ${CATEGORY_IMAGE}\n`);
    }
  }

  const unitMap = new Map<string, string>();
  for (const unitId of units) {
    const unit = await prisma.unit.findUnique({ where: { id: unitId }, select: { name: true } });
    if (unit) unitMap.set(unit.name.toLowerCase(), unitId);
  }

  let productCodeCounter = lastProduct ? parseInt(lastProduct.code) + 1 : 1000;

  // Store created product IDs for image upload (done outside transaction)
  const createdProducts: { id: string; name: string; imageFile?: string }[] = [];

  // Process all products in a single transaction for speed
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        // Parse prices
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
        if (sellingPriceValue && sellingPriceValue !== '' && sellingPriceValue !== 0) {
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
          category_id: categoryId,
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

        let productId: string;

        if (existing) {
          await tx.product.update({
            where: { id: existing.id },
            data: productData,
          });
          productId = existing.id;
        } else {
          const sku = await generateSKU(product.name);
          const created = await tx.product.create({
            data: {
              ...productData,
              code: (productCodeCounter++).toString(),
              sku,
            },
          });
          productId = created.id;
        }

        createdProducts.push({
          id: productId,
          name: product.name,
          imageFile: product.image,
        });

        results.success.push(product.name);
        console.log(
          `✅ [${i + 1}/${products.length}] ${product.name} - Created/Updated (ID: ${productId})`
        );
      } catch (error) {
        const errorMessage = (error as Error).message;
        results.failed.push({ name: product.name, error: errorMessage });
        console.error(
          `❌ [${i + 1}/${products.length}] ${product.name} - Failed: ${errorMessage}`
        );
      }
    }
  }, {
    maxWait: 60000,
    timeout: 60000,
  });

  // Upload images to Cloudinary for each product
  if (fs.existsSync(IMAGES_DIR)) {
    console.log('\n📸 Uploading product images to Cloudinary...\n');

    for (let i = 0; i < createdProducts.length; i++) {
      const { id, name, imageFile } = createdProducts[i];

      if (!imageFile) {
        console.log(`⏭️  [${i + 1}/${createdProducts.length}] ${name} - No image specified`);
        continue;
      }

      try {
        const imagePath = findImageFile(imageFile);
        if (!imagePath) {
          console.log(`⚠️  [${i + 1}/${createdProducts.length}] ${name} - Image not found: ${imageFile}`);
          results.imagesFailed++;
          continue;
        }

        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(imagePath, name);

        // Check if product already has an image
        const existingImage = await prisma.productImage.findFirst({
          where: { product_id: id },
        });

        if (existingImage) {
          await prisma.productImage.update({
            where: { id: existingImage.id },
            data: {
              image: cloudinaryUrl,
              status: 'COMPLETE',
              is_active: true,
            },
          });
        } else {
          // Save image record in database
          await prisma.productImage.create({
            data: {
              product_id: id,
              image: cloudinaryUrl,
              status: 'COMPLETE',
              is_active: true,
            },
          });
        }

        // Update product has_images flag
        await prisma.product.update({
          where: { id },
          data: { has_images: true },
        });

        results.imagesUploaded++;
        console.log(
          `📸 [${i + 1}/${createdProducts.length}] ${name} - Uploaded ✅ ${cloudinaryUrl}`
        );

        // Small delay to avoid Cloudinary rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        const errorMessage = (error as Error).message;
        results.imagesFailed++;
        console.error(
          `📸 [${i + 1}/${createdProducts.length}] ${name} - Image failed: ${errorMessage}`
        );
      }
    }
  }

  console.log('\n📊 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   ✅ Successfully created/updated: ${results.success.length} products`);
  console.log(`   ❌ Failed: ${results.failed.length} products`);
  console.log(`   📸 Images uploaded: ${results.imagesUploaded}`);
  console.log(`   📸 Images failed: ${results.imagesFailed}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed products:');
    results.failed.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✅ Dates seeder completed!');
}

// Run seeder
seedDates()
  .then(() => {
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    return prisma.$disconnect().then(() => process.exit(1));
  });
