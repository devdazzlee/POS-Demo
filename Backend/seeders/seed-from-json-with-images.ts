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

interface ProductInput {
  name: string;
  category: string;
  price?: number | string;
  selling_price?: number | string;
  quantity?: number;
  unit: string;
  image?: string;
  image_link?: string; // For spices JSON format
}

interface CategoryConfig {
  name: string;
  jsonFile: string;
  imagesDir: string;
  categoryImage: string;
  useCategoryImageForProducts?: boolean; // If true, use category image for all products
}

const categories: CategoryConfig[] = [
  {
    name: 'Dates',
    jsonFile: path.resolve(__dirname, '../seeder_with_images/dates-products.json'),
    imagesDir: path.resolve(__dirname, '../seeder_images/dates'),
    categoryImage: 'maincategory dates.PNG',
  },
  {
    name: 'Dried Fruits & Nuts',
    jsonFile: path.resolve(__dirname, '../seeder_with_images/dried-fruits-nuts-products.json'),
    imagesDir: path.resolve(__dirname, '../seeder_images/dried_fruit_nuts'),
    categoryImage: 'dried_fruit_nuts_category.jpeg',
  },
  {
    name: 'Grains, Pulses & Rice',
    jsonFile: path.resolve(__dirname, '../seeder_with_images/grains_pulses_rice.json'),
    imagesDir: path.resolve(__dirname, '../seeder_images/grains_pulses_rice'),
    categoryImage: 'main_category_image.jpeg',
  },
  {
    name: 'Spices',
    jsonFile: path.resolve(__dirname, '../image-seeder/spices_products.json'),
    imagesDir: path.resolve(__dirname, '../seeder_images/spices'),
    categoryImage: 'spice_main_category.PNG',
    useCategoryImageForProducts: true, // Use category image for all products
  },
];

// Helper: upload image to Cloudinary
async function uploadToCloudinary(
  filePath: string,
  name: string,
  folder: string = 'manpasand/products'
): Promise<string> {
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
function findImageFile(imageFilename: string, imagesDir: string): string | null {
  // Try exact match first
  const exactPath = path.join(imagesDir, imageFilename);
  if (fs.existsSync(exactPath)) {
    return exactPath;
  }

  // Try case-insensitive match by scanning directory
  try {
    if (!fs.existsSync(imagesDir)) {
      return null;
    }
    const files = fs.readdirSync(imagesDir);
    const lowerTarget = imageFilename.toLowerCase();
    const match = files.find((f) => f.toLowerCase() === lowerTarget);
    if (match) {
      return path.join(imagesDir, match);
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
  const initials = words.map((w) => w.charAt(0).toUpperCase()).join('');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${initials}${random}`;
}

async function seedCategory(config: CategoryConfig, startCodeCounter: number) {
  console.log(`\n🌱 Processing category: ${config.name}...\n`);

  const results = {
    success: [] as string[],
    failed: [] as { name: string; error: string }[],
    imagesUploaded: 0,
    imagesFailed: 0,
    nextCodeCounter: startCodeCounter,
  };

  // Check if JSON file exists
  if (!fs.existsSync(config.jsonFile)) {
    console.error(`❌ JSON file not found: ${config.jsonFile}`);
    return results;
  }

  // Load products from JSON
  const products: ProductInput[] = JSON.parse(fs.readFileSync(config.jsonFile, 'utf-8'));
  console.log(`📦 Loaded ${products.length} products from JSON`);

  // Check if images directory exists
  if (!fs.existsSync(config.imagesDir)) {
    console.warn(`⚠️  Images directory not found: ${config.imagesDir}`);
    console.log('   Continuing without images...\n');
  } else {
    const imageFiles = fs.readdirSync(config.imagesDir).filter((f) => !f.startsWith('.'));
    console.log(`📸 Found ${imageFiles.length} images in directory\n`);
  }

  // Pre-fetch all relations once
  const [categoryId, units, unknownTax, unknownSupplier, unknownBrand] = await Promise.all([
    getOrCreateEntry('category', config.name, 'CAT'),
    Promise.all([
      getOrCreateEntry('unit', 'Kgs', 'UNIT'),
      getOrCreateEntry('unit', 'Kg', 'UNIT'),
      getOrCreateEntry('unit', 'Pcs', 'UNIT'),
    ]),
    getOrCreateEntry('tax', 'Unknown', 'TAX'),
    getOrCreateEntry('supplier', 'Unknown', 'SUP'),
    getOrCreateEntry('brand', 'Unknown', 'BRA'),
  ]);

  console.log(`✅ Category "${config.name}" ready (ID: ${categoryId})`);

  // Upload category image and store URL for potential use with products
  let categoryImageUrl: string | null = null;
  if (fs.existsSync(config.imagesDir)) {
    const categoryImagePath = findImageFile(config.categoryImage, config.imagesDir);
    if (categoryImagePath) {
      try {
        console.log(`📤 Uploading category image...`);
        const cloudinaryUrl = await uploadToCloudinary(
          categoryImagePath,
          `${config.name.toLowerCase().replace(/\s+/g, '_')}_category`,
          'manpasand/categories'
        );
        categoryImageUrl = cloudinaryUrl;

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
      console.log(`⚠️  Category image not found: ${config.categoryImage}\n`);
    }
  }

  const unitMap = new Map<string, string>();
  for (const unitId of units) {
    const unit = await prisma.unit.findUnique({ where: { id: unitId }, select: { name: true } });
    if (unit) unitMap.set(unit.name.toLowerCase(), unitId);
  }

  let productCodeCounter = startCodeCounter;

  // Store created product IDs for image upload (done outside transaction)
  const createdProducts: { id: string; name: string; imageFile?: string }[] = [];

  // Process all products in a single transaction for speed
  await prisma.$transaction(
    async (tx) => {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        try {
          // Parse prices - handle both price and selling_price fields
          let sellingPrice = 0;
          const priceValue = product.price || product.selling_price;
          if (priceValue && priceValue !== '' && priceValue !== 0) {
            if (typeof priceValue === 'number') {
              sellingPrice = priceValue;
            } else if (typeof priceValue === 'string') {
              sellingPrice = parseFloat(priceValue) || 0;
            }
          }

          // Get unit ID - normalize unit name
          const unitName = product.unit.toLowerCase().trim();
          const normalizedUnit = unitName === 'kg' ? 'kgs' : unitName;
          const unitId = unitMap.get(normalizedUnit) || units[0];

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
            purchase_rate: new Prisma.Decimal(0),
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
            const code = productCodeCounter.toString();
            productCodeCounter++;
            const created = await tx.product.create({
              data: {
                ...productData,
                code,
                sku,
              },
            });
            productId = created.id;
          }

          // Handle both image and image_link fields
          const imageFile = product.image || product.image_link || undefined;
          createdProducts.push({
            id: productId,
            name: product.name,
            imageFile: imageFile,
          });

          results.success.push(product.name);
          console.log(`✅ [${i + 1}/${products.length}] ${product.name} - Created/Updated (ID: ${productId})`);
        } catch (error) {
          const errorMessage = (error as Error).message;
          results.failed.push({ name: product.name, error: errorMessage });
          console.error(`❌ [${i + 1}/${products.length}] ${product.name} - Failed: ${errorMessage}`);
        }
      }
    },
    {
      maxWait: 60000,
      timeout: 60000,
    }
  );

  // Update the code counter in results
  results.nextCodeCounter = productCodeCounter;

  // Upload images to Cloudinary for each product
  if (fs.existsSync(config.imagesDir) || config.useCategoryImageForProducts) {
    console.log('\n📸 Uploading product images to Cloudinary...\n');

    // If using category image for all products, use that URL
    if (config.useCategoryImageForProducts && categoryImageUrl) {
      console.log(`📸 Using category image for all products...\n`);
      
      for (let i = 0; i < createdProducts.length; i++) {
        const { id, name } = createdProducts[i];
        
        try {
          // Check if product already has an image
          const existingImage = await prisma.productImage.findFirst({
            where: { product_id: id },
          });

          if (existingImage) {
            await prisma.productImage.update({
              where: { id: existingImage.id },
              data: {
                image: categoryImageUrl,
                status: 'COMPLETE',
                is_active: true,
              },
            });
          } else {
            // Save image record in database
            await prisma.productImage.create({
              data: {
                product_id: id,
                image: categoryImageUrl,
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
          console.log(`📸 [${i + 1}/${createdProducts.length}] ${name} - Category image set ✅`);

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          const errorMessage = (error as Error).message;
          results.imagesFailed++;
          console.error(`📸 [${i + 1}/${createdProducts.length}] ${name} - Image failed: ${errorMessage}`);
        }
      }
    } else {
      // Normal flow: use individual product images
      for (let i = 0; i < createdProducts.length; i++) {
        const { id, name, imageFile } = createdProducts[i];

        if (!imageFile) {
          console.log(`⏭️  [${i + 1}/${createdProducts.length}] ${name} - No image specified`);
          continue;
        }

        try {
          const imagePath = findImageFile(imageFile, config.imagesDir);
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
        console.log(`📸 [${i + 1}/${createdProducts.length}] ${name} - Uploaded ✅`);

        // Small delay to avoid Cloudinary rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        const errorMessage = (error as Error).message;
        results.imagesFailed++;
        console.error(`📸 [${i + 1}/${createdProducts.length}] ${name} - Image failed: ${errorMessage}`);
      }
      }
    }
  }

  console.log(`\n📊 Summary for ${config.name}:`);
  console.log(`   ✅ Successfully created/updated: ${results.success.length} products`);
  console.log(`   ❌ Failed: ${results.failed.length} products`);
  console.log(`   📸 Images uploaded: ${results.imagesUploaded}`);
  console.log(`   📸 Images failed: ${results.imagesFailed}`);

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed products:`);
    results.failed.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }

  return results;
}

async function seedAll() {
  console.log('🚀 Starting seeder from JSON files with images...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get the last product code once for all categories
  const lastProduct = await prisma.product.findFirst({
    orderBy: { created_at: 'desc' },
    select: { code: true },
  });

  let productCodeCounter = 1000;
  if (lastProduct) {
    const codeNum = parseInt(lastProduct.code);
    if (!isNaN(codeNum)) {
      productCodeCounter = codeNum + 1;
    }
  }

  const allResults = {
    totalSuccess: 0,
    totalFailed: 0,
    totalImagesUploaded: 0,
    totalImagesFailed: 0,
  };

  for (const category of categories) {
    const results = await seedCategory(category, productCodeCounter);
    productCodeCounter = results.nextCodeCounter || productCodeCounter;
    allResults.totalSuccess += results.success.length;
    allResults.totalFailed += results.failed.length;
    allResults.totalImagesUploaded += results.imagesUploaded;
    allResults.totalImagesFailed += results.imagesFailed;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 OVERALL SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   ✅ Total products created/updated: ${allResults.totalSuccess}`);
  console.log(`   ❌ Total products failed: ${allResults.totalFailed}`);
  console.log(`   📸 Total images uploaded: ${allResults.totalImagesUploaded}`);
  console.log(`   📸 Total images failed: ${allResults.totalImagesFailed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✅ Seeder completed!');
}

// Run seeder
seedAll()
  .then(() => {
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    return prisma.$disconnect().then(() => process.exit(1));
  });
