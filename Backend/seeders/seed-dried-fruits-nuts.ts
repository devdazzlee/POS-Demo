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

const IMAGES_DIR = path.resolve(__dirname, '../seeder_images/dried_fruit_nuts');

interface ProductInput {
  name: string;
  unit: string;
  category: string;
  purchase_rate?: number | string;
  selling_price: number | string;
  image?: string; // local image filename
}

const products: ProductInput[] = [
  { name: "Almonds Whole (Kaghzi)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1750, selling_price: 2800, image: "Almonds Whole (Kaghzi).jpg" },
  { name: "Almonds Whole (Katha)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 800, selling_price: 1200, image: "Almonds Whole (Katha).jpg" },
  { name: "Almonds Whole (Wahidi)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1750, selling_price: 2400, image: "Almonds Whole (Wahidi).jpg" },
  { name: "American Almonds large", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3450, selling_price: 4800, image: "American Almonds large.jpg" },
  { name: "American Almonds Medium", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 2650, selling_price: 4000, image: "American Almonds Medium.jpg" },
  { name: "American Almonds Small", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 2550, selling_price: 3600, image: "American Almonds Small.jpg" },
  { name: "Apricot's Seed's Almonds", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1350, selling_price: 2200, image: "Apricot's Seed's Almonds.jpg" },
  { name: "Banana Chips (Salted)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: "", selling_price: 2800, image: "Banana Chips (Salted).jpg" },
  { name: "Banana Chips (Spicy)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: "", selling_price: 2800, image: "Banana Chips (Spicy).jpg" },
  { name: "Black Raisins (Kaali Kishmish)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1200, selling_price: 1800, image: "Black Raisins (Kaali Kishmish).jpg" },
  { name: "Coconut (Grated)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1300, selling_price: 2000, image: "Coconut (Grated).jpg" },
  { name: "Coconut (Grounded)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1800, selling_price: 2600, image: "Coconut (Grounded).jpg" },
  { name: "Coconut (Half Piece)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1400, selling_price: 1800, image: "Coconut (Half Piece).jpg" },
  { name: "Dried Apricot with Seed", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1200, selling_price: 2400, image: "Dried Apricot with Seed.jpg" },
  { name: "Dried Apricot without Seed (Golden)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1300, selling_price: 2200, image: "Dried Apricot without Seed (Golden).jpg" },
  { name: "Dried Cherry", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: "", selling_price: 5600, image: "Dried Cherry.jpg" },
  { name: "Dried Dates (Chuwara)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 450, selling_price: 1000, image: "Dried Dates (Chuwara).webp" },
  { name: "Dried Dates (Nar Chuwara)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 680, selling_price: 1600, image: "Dried Dates (Nar Chuwara).webp" },
  { name: "Dried Figs ( Persian )", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1600, selling_price: 4800, image: "Dried Figs ( Persian ).jpg" },
  { name: "Dried Maango", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: "", selling_price: 5600, image: "Dried Maango.jpg" },
  { name: "Dried Pineapple", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: "", selling_price: 5600, image: "Dried Pineapple.jpg" },
  { name: "Dried Strawberry", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: "", selling_price: 5600, image: "Dried Strawberry.jpg" },
  { name: "Figs (Extra Large)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1400, selling_price: 6400, image: "Figs (Extra Large).jpg" },
  { name: "Figs (Large)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1200, selling_price: 4800, image: "Figs (Large).jpg" },
  { name: "Figs (Medium)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1000, selling_price: 4400, image: "Figs (Medium).jpg" },
  { name: "Figs (Small)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 800, selling_price: 3600, image: "Figs (Small).jpg" },
  { name: "Figs Turkish", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3400, selling_price: 6800, image: "Figs Turkish.jpg" },
  { name: "Flavoured Cashews (BBQ)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: "", selling_price: 7200, image: "Flavoured Cashews (BBQ).jpg" },
  { name: "Flavoured Cashews (Black Pepper)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: "", selling_price: 7200, image: "Flavoured Cashews (Black Pepper).jpg" },
  { name: "Flavoured Cashews (Cheese)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: "", selling_price: 7200, image: "Flavoured Cashews (Cheese).jpg" },
  { name: "Flavoured Cashews (Jalapeno)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: "", selling_price: 7200, image: "Flavoured Cashews (Jalapeno).jpg" },
  { name: "Flavoured Cashews (Peri Peri)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: "", selling_price: 7200, image: "Flavoured Cashews (Peri Peri).jpg" },
  { name: "Gum Crystal (gondh babool)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 750, selling_price: 1600, image: "Gum Crystal (gondh babool).jpg" },
  { name: "Kandhari Almonds", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1200, selling_price: 2400, image: "Kandhari Almonds.jpg" },
  { name: "Makhana", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 4200, selling_price: 8000, image: "Makhana.jpg" },
  { name: "Mixed Dried Fruits", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: "", selling_price: 5600, image: "Mixed Dried Fruits.jpg" },
  { name: "Mixed Melon Seeds (4 Maghaz)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1300, selling_price: 3200, image: "Mixed Melon Seeds (4 Maghaz).jpg" },
  { name: "Mixed Nuts", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1500, selling_price: 5400, image: "Mixed Nuts.jpg" },
  { name: "Munaqqa", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 850, selling_price: 2000, image: "Munaqqa.jpg" },
  { name: "Persian Almonds", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 4900, selling_price: 7200, image: "Persian Almonds.jpg" },
  { name: "Pine Seeds (Shell)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 4500, selling_price: 8000, image: "Pine Seeds (Shell).jpg" },
  { name: "Pine Seeds (Shell) GOLD", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 6500, selling_price: 9600, image: "Pine Seeds (Shell) GOLD.jpg" },
  { name: "Pine Seeds W/O Shell", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 9500, selling_price: 12000, image: "Pine Seeds W:O Shell.jpg" },
  { name: "Pine Seeds W/O Shell GOLD", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 9500, selling_price: 16000, image: "Pine Seeds W:O Shell GOLD.jpg" },
  { name: "Plain Cashews (180)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 4200, selling_price: 6400, image: "Plain Cashews (180).jpg" },
  { name: "Plain Cashews (240)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3800, selling_price: 4800, image: "Plain Cashews (240).jpg" },
  { name: "Plain Cashews (320)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3600, selling_price: 4400, image: "Plain Cashews (320).jpg" },
  { name: "Plain Pistachios", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 5400, selling_price: 9600, image: "Plain Pistachios.jpg" },
  { name: "Pumpkin Seeds Peeled", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1300, selling_price: 3600, image: "Pumpkin Seeds Peeled.jpg" },
  { name: "Pumpkin Seeds Whole (Long)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1600, selling_price: 2400, image: "Pumpkin Seeds Whole (Long).jpg" },
  { name: "Pumpkin Seeds Whole (round)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 750, selling_price: 1600, image: "Pumpkin Seeds Whole (round).jpg" },
  { name: "Raisins (Sundarkhani)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1200, selling_price: 2400, image: "Raisins (Sundarkhani).jpg" },
  { name: "Raisins Round", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 800, selling_price: 1800, image: "Raisins Round.jpg" },
  { name: "Roasted Almonds", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3000, selling_price: 4800, image: "Roasted Almonds.jpg" },
  { name: "Roasted Cashew Nuts (180)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 4200, selling_price: 6800, image: "Roasted Cashew Nuts (180).jpg" },
  { name: "Roasted Cashew Nuts (240)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 4000, selling_price: 5600, image: "Roasted Cashew Nuts (240).jpg" },
  { name: "Roasted Cashew Nuts (320)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3800, selling_price: 4800, image: "Roasted Cashew Nuts (320).jpg" },
  { name: "Roasted Peanuts", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 700, selling_price: 1000, image: "Roasted Peanuts.jpg" },
  { name: "Roasted Peanuts (Whole)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1300, selling_price: 1800, image: "Roasted Peanuts.jpg" },
  { name: "Roasted Pistachios", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3800, selling_price: 5600, image: "Roasted Pistachios.jpg" },
  { name: "Salted Peanuts", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 840, selling_price: 1280, image: "Salted Peanuts.jpg" },
  { name: "Salted Pistachios", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3400, selling_price: 5600, image: "Salted Pistachios.jpg" },
  { name: "Sliced Almonds", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 2500, selling_price: 4800, image: "Sliced Almonds.jpg" },
  { name: "Sliced Coconuts", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 1450, selling_price: 2400, image: "Sliced Coconuts.jpg" },
  { name: "Sliced Dried Dates (Chuwara)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 550, selling_price: 1400, image: "Sliced Dried Dates (Chuwara).jpeg" },
  { name: "Sliced Pistachios", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 4500, selling_price: 10000, image: "Sliced Pistachios.jpg" },
  { name: "Sliced Plain Cashews", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 2000, selling_price: 3200, image: "Sliced Plain Cashews.jpg" },
  { name: "Smoked Almonds", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3000, selling_price: 4800, image: "Smoked Almonds.jpg" },
  { name: "Spicy Peanuts", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 840, selling_price: 1280, image: "Spicy Peanuts.jpg" },
  { name: "Sweet Almonds", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 3200, selling_price: 6800, image: "Sweet Almonds.jpg" },
  { name: "Unroasted Peanuts", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 680, selling_price: 1600, image: "Unroasted Peanuts.jpg" },
  { name: "Unroasted Peanuts (Skin)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 680, selling_price: 1600, image: "Unroasted Peanuts (Skin).jpg" },
  { name: "Walnuts", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 2400, selling_price: 4400, image: "Walnuts.jpg" },
  { name: "Walnuts (GOLA)", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 2600, selling_price: 4800, image: "Walnuts (GOLA).jpg" },
  { name: "Walnuts Whole", unit: "Kgs", category: "Dried Fruits & Nuts", purchase_rate: 750, selling_price: 1800, image: "Walnuts Whole.jpg" },
];

// Helper: upload image to Cloudinary
async function uploadToCloudinary(filePath: string, productName: string): Promise<string> {
  const publicId = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        public_id: publicId,
        folder: 'manpasand/products',
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

async function seedDriedFruitsNuts() {
  console.log('🌱 Starting Dried Fruits & Nuts seeder (with images)...\n');

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
    getOrCreateEntry('category', 'Dried Fruits & Nuts', 'CAT'),
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

  console.log(`✅ Category "Dried Fruits & Nuts" ready (ID: ${categoryId})`);

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

        // Save image record in database
        await prisma.productImage.create({
          data: {
            product_id: id,
            image: cloudinaryUrl,
            status: 'COMPLETE',
            is_active: true,
          },
        });

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
  console.log('\n✅ Dried Fruits & Nuts seeder completed!');
}

// Run seeder
seedDriedFruitsNuts()
  .then(() => {
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    return prisma.$disconnect().then(() => process.exit(1));
  });
