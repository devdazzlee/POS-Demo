import { ProductService } from '../src/services/product.service';
import { prisma } from '../src/prisma/client';
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

const IMAGES_DIR = path.resolve(__dirname, '../seeder_images/spices');
const CATEGORY_IMAGE = 'spice_main_category.PNG';

interface ProductInput {
  name: string;
  unit: string;
  category: string;
  purchase_rate?: number | string;
  selling_price: number | string;
}

const products: ProductInput[] = [
  { name: "Achar Gosht Masalah", unit: "Kgs", category: "Spices", purchase_rate: 800, selling_price: 2400 },
  { name: "Achar Masalah", unit: "Kgs", category: "Spices", purchase_rate: 800, selling_price: 2400 },
  { name: "BBQ Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
  { name: "Bihari Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
  { name: "Biryani Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
  { name: "Black Cardamom (Bari Elaichi)", unit: "Kgs", category: "Spices", purchase_rate: 8000, selling_price: 11000 },
  { name: "Black Cumin (Kaala Zeera)", unit: "Kgs", category: "Spices", purchase_rate: 1320, selling_price: 1800 },
  { name: "Black Pepper (Kaali Mirch)", unit: "Kgs", category: "Spices", purchase_rate: 1200, selling_price: 3600 },
  { name: "Black Pepper Powder (Kaali Mirch)", unit: "Kgs", category: "Spices", purchase_rate: 1280, selling_price: 3800 },
  { name: "Black Prunes (Kandhari)", unit: "Kgs", category: "Spices", purchase_rate: 920, selling_price: 1800 },
  { name: "Black Salt Grounded", unit: "Kgs", category: "Spices", purchase_rate: 80, selling_price: 800 },
  { name: "Black Seeds (Kalonji)", unit: "Kgs", category: "Spices", purchase_rate: 840, selling_price: 1800 },
  { name: "Black Seeds Powder (Kalonji)", unit: "Kgs", category: "Spices", purchase_rate: 900, selling_price: 2400 },
  { name: "Carom Seeds (Ajwain)", unit: "Kgs", category: "Spices", purchase_rate: 360, selling_price: 800 },
  { name: "Carom Seeds Powder (Ajwain)", unit: "Kgs", category: "Spices", purchase_rate: 380, selling_price: 1200 },
  { name: "Chat Masalah", unit: "Kgs", category: "Spices", purchase_rate: 400, selling_price: 1200 },
  { name: "Chicken Powder", unit: "Kgs", category: "Spices", purchase_rate: 480, selling_price: 1000 },
  { name: "Chinese Salt", unit: "Kgs", category: "Spices", purchase_rate: 800, selling_price: 2400 },
  { name: "Cinnamon Ceylon (Round)", unit: "Kgs", category: "Spices", purchase_rate: 2000, selling_price: 4400 },
  { name: "Cinnamon- Cassia", unit: "Kgs", category: "Spices", purchase_rate: 900, selling_price: 2000 },
  { name: "Cinnamon- Cassia Powder", unit: "Kgs", category: "Spices", purchase_rate: 1000, selling_price: 2400 },
  { name: "Citric Acid (Tatri)", unit: "Kgs", category: "Spices", purchase_rate: 320, selling_price: 1200 },
  { name: "Cloves (Long)", unit: "Kgs", category: "Spices", purchase_rate: 2900, selling_price: 5600 },
  { name: "Cloves Powder (Long)", unit: "Kgs", category: "Spices", purchase_rate: 3600, selling_price: 6000 },
  { name: "Coriander Seeds (Sabut Dhanya)", unit: "Kgs", category: "Spices", purchase_rate: 480, selling_price: 1200 },
  { name: "Coriander Seeds Powder (Pisa Dhanya)", unit: "Kgs", category: "Spices", purchase_rate: 500, selling_price: 1400 },
  { name: "Crushed Coriander (Kuta Dhanya)", unit: "Kgs", category: "Spices", purchase_rate: 500, selling_price: 1400 },
  { name: "Crushed Fenugreek Seeds (Kuta Methi Dana)", unit: "Kgs", category: "Spices", purchase_rate: 320, selling_price: 1000 },
  { name: "Crushed Red Chilli", unit: "Kgs", category: "Spices", purchase_rate: 650, selling_price: 1800 },
  { name: "Curry Leaves Powder", unit: "Kgs", category: "Spices", purchase_rate: 0, selling_price: 0 },
  { name: "Dahi Barra Masalah", unit: "Kgs", category: "Spices", purchase_rate: 680, selling_price: 1800 },
  { name: "Dried Ginger Grounded (Sonth)", unit: "Kgs", category: "Spices", purchase_rate: 1280, selling_price: 2800 },
  { name: "Fennel Seeds", unit: "Kgs", category: "Spices", purchase_rate: 680, selling_price: 1600 },
  { name: "Fennel Seeds Powder", unit: "Kgs", category: "Spices", purchase_rate: 560, selling_price: 2400 },
  { name: "Fenugreek Seeds (Methi Daana)", unit: "Kgs", category: "Spices", purchase_rate: 240, selling_price: 800 },
  { name: "Fish Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
  { name: "Garam Masalah Mix (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 2400, selling_price: 4800 },
  { name: "Garam Masalah Powder", unit: "Kgs", category: "Spices", purchase_rate: 1800, selling_price: 5600 },
  { name: "Garlic (Lehsan) Powder", unit: "Kgs", category: "Spices", purchase_rate: 1040, selling_price: 1400 },
  { name: "General Masalah", unit: "Kgs", category: "Spices", purchase_rate: 960, selling_price: 2400 },
  { name: "Golden Prunes", unit: "Kgs", category: "Spices", purchase_rate: 560, selling_price: 1800 },
  { name: "Green Cardamom (Elaichi)", unit: "Kgs", category: "Spices", purchase_rate: 10800, selling_price: 20000 },
  { name: "Green Cardamom Powder (Elaichi)", unit: "Kgs", category: "Spices", purchase_rate: 9600, selling_price: 15000 },
  { name: "Kabab Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
  { name: "Kachri (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 500, selling_price: 1200 },
  { name: "Kachri Powder", unit: "Kgs", category: "Spices", purchase_rate: 650, selling_price: 1400 },
  { name: "Kaleji Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
  { name: "Karahi Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
  { name: "Kasuri Methi", unit: "Kgs", category: "Spices", purchase_rate: 240, selling_price: 1000 },
  { name: "Khashkhash", unit: "Kgs", category: "Spices", purchase_rate: 800, selling_price: 1600 },
  { name: "Khatai (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 140, selling_price: 1200 },
  { name: "Khatai Powder", unit: "Kgs", category: "Spices", purchase_rate: 280, selling_price: 1400 },
  { name: "Lahori Salt (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 30, selling_price: 100 },
  { name: "Lahori Salt Powder", unit: "Kgs", category: "Spices", purchase_rate: 30, selling_price: 100 },
  { name: "Mace (Javitri)", unit: "Kgs", category: "Spices", purchase_rate: 7600, selling_price: 9600 },
  { name: "Mace Powder (Javitri-Box)", unit: "Pcs", category: "Spices", purchase_rate: 25, selling_price: 16000 },
  { name: "Mace Powder (Javitri)", unit: "Kgs", category: "Spices", purchase_rate: 6700, selling_price: 0 },
  { name: "Marwari Mirch", unit: "Kgs", category: "Spices", purchase_rate: 750, selling_price: 1200 },
  { name: "Mixed Red Chilli Powder", unit: "Kgs", category: "Spices", purchase_rate: 900, selling_price: 1800 },
  { name: "Mixed Salan Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
  { name: "Mustard Seeds", unit: "Kgs", category: "Spices", purchase_rate: 280, selling_price: 800 },
  { name: "Mustard Seeds Powder", unit: "Kgs", category: "Spices", purchase_rate: 480, selling_price: 1000 },
  { name: "National Salt", unit: "Kgs", category: "Spices", purchase_rate: 58, selling_price: 100 },
  { name: "Nihari Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
  { name: "Nutmeg (Jaifal)", unit: "Kgs", category: "Spices", purchase_rate: 1800, selling_price: 6000 },
  { name: "Nutmeg powder (Jaifal-Box)", unit: "Pcs", category: "Spices", purchase_rate: 2900, selling_price: 16000 },
  { name: "Nutmeg Powder (Jaifal)", unit: "Kgs", category: "Spices", purchase_rate: 4100, selling_price: 0 },
  { name: "Pakora Mix", unit: "Kgs", category: "Spices", purchase_rate: 560, selling_price: 1800 },
  { name: "Paprika (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 1050, selling_price: 4000 },
  { name: "Paprika Powder", unit: "Kgs", category: "Spices", purchase_rate: 1000, selling_price: 2400 },
  { name: "Patna Red Chilli", unit: "Kgs", category: "Spices", purchase_rate: 700, selling_price: 1600 },
  { name: "Paya Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
  { name: "Persian Cumin (Special Zeera)", unit: "Kgs", category: "Spices", purchase_rate: 2800, selling_price: 4000 },
  { name: "Pink Salt", unit: "Kgs", category: "Spices", purchase_rate: 30, selling_price: 100 },
  { name: "Pipliyan", unit: "Kgs", category: "Spices", purchase_rate: 3200, selling_price: 4800 },
  { name: "Pomegranate (Anaar) Seeds", unit: "Kgs", category: "Spices", purchase_rate: 500, selling_price: 1800 },
  { name: "Pomegranate (Anaar) seeds Powder", unit: "Kgs", category: "Spices", purchase_rate: 540, selling_price: 2400 },
  { name: "Pulao Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
  { name: "Qorma Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
  { name: "Round Red Chilli (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 1050, selling_price: 1600 },
  { name: "Round Red Chilli Powder", unit: "Kgs", category: "Spices", purchase_rate: 750, selling_price: 1800 },
  { name: "Seekh Kabab Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
  { name: "Silver Coated Cardamom (Elaichi)", unit: "Kgs", category: "Spices", purchase_rate: 6000, selling_price: 20000 },
  { name: "Star Anise (Badian K Phool)", unit: "Kgs", category: "Spices", purchase_rate: 1280, selling_price: 4800 },
  { name: "Tamarind", unit: "Kgs", category: "Spices", purchase_rate: 340, selling_price: 700 },
  { name: "Tikka Masalah", unit: "Kgs", category: "Spices", purchase_rate: 880, selling_price: 2400 },
  { name: "Tukhm e Balanga", unit: "Kgs", category: "Spices", purchase_rate: 1000, selling_price: 2800 },
  { name: "Turmeric (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 750, selling_price: 1600 },
  { name: "Turmeric Powder", unit: "Kgs", category: "Spices", purchase_rate: 650, selling_price: 1800 },
  { name: "White Cumin (Safaid Zeera)", unit: "Kgs", category: "Spices", purchase_rate: 1600, selling_price: 3600 },
  { name: "White Cumin Powder (Zeera Powder)", unit: "Kgs", category: "Spices", purchase_rate: 1200, selling_price: 3800 },
  { name: "White Pepper (Grounded)", unit: "Kgs", category: "Spices", purchase_rate: 3400, selling_price: 5200 },
  { name: "White Pepper (Whole)", unit: "Kgs", category: "Spices", purchase_rate: 2300, selling_price: 4800 },
  { name: "White Sesame seed (Safaid Til)", unit: "Kgs", category: "Spices", purchase_rate: 560, selling_price: 1800 },
  { name: "Whole Dried Ginger (Sonth)", unit: "Kgs", category: "Spices", purchase_rate: 1200, selling_price: 2400 },
  { name: "Yellow Mustard", unit: "Kgs", category: "Spices", purchase_rate: 400, selling_price: 1600 },
  { name: "Bay leaf (Tez Patta)", unit: "Kgs", category: "Spices", purchase_rate: 720, selling_price: 1500 },
  // Herbs category products
  { name: "Green Cardamom Seeds", unit: "Kgs", category: "Herbs", purchase_rate: 10000, selling_price: 20000 },
  { name: "Black Cardamom Seeds", unit: "Kgs", category: "Herbs", purchase_rate: 8000, selling_price: 16000 },
  { name: "Black Sesame seeds (Kaala Til)", unit: "Kgs", category: "Herbs", purchase_rate: 750, selling_price: 1600 },
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
  const exactPath = path.join(IMAGES_DIR, imageFilename);
  if (fs.existsSync(exactPath)) {
    return exactPath;
  }

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

async function seedSpices() {
  console.log('🌱 Starting Spices seeder (with category image)...\n');

  const productService = new ProductService();
  const results = {
    success: [] as string[],
    failed: [] as { name: string; error: string }[],
  };

  // Get or create Spices category
  const categoryId = await getOrCreateEntry('category', 'Spices', 'CAT');
  console.log(`✅ Category "Spices" ready (ID: ${categoryId})`);

  // Upload category image
  if (fs.existsSync(IMAGES_DIR)) {
    const categoryImagePath = findImageFile(CATEGORY_IMAGE);
    if (categoryImagePath) {
      try {
        console.log(`📤 Uploading Spices category image...`);
        const cloudinaryUrl = await uploadToCloudinary(categoryImagePath, 'spices_category', 'manpasand/categories');

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
  } else {
    console.log(`⚠️  Images directory not found: ${IMAGES_DIR}\n`);
  }

  console.log(`📦 Processing ${products.length} products...\n`);

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    try {
      // Handle purchase rate - use 0 if missing, don't calculate
      let purchaseRate: number = 0;
      const purchaseRateValue = product.purchase_rate;

      if (purchaseRateValue && purchaseRateValue !== '' && purchaseRateValue !== 'Default') {
        if (typeof purchaseRateValue === 'number') {
          purchaseRate = purchaseRateValue;
        } else if (typeof purchaseRateValue === 'string') {
          purchaseRate = parseFloat(purchaseRateValue) || 0;
        }
      }

      // Handle selling price - use 0 if missing, don't calculate
      let sellingPrice: number = 0;
      const sellingPriceValue = product.selling_price;

      if (sellingPriceValue && sellingPriceValue !== '' && sellingPriceValue !== 0) {
        if (typeof sellingPriceValue === 'number') {
          sellingPrice = sellingPriceValue;
        } else if (typeof sellingPriceValue === 'string') {
          sellingPrice = parseFloat(sellingPriceValue) || 0;
        }
      }

      // Create or update product using ProductService (it handles upserts)
      const created = await productService.createProductFromBulkUpload({
        name: product.name,
        category_name: product.category,
        unit_name: product.unit,
        purchase_rate: purchaseRate,
        sales_rate_exc_dis_and_tax: sellingPrice,
        sales_rate_inc_dis_and_tax: sellingPrice,
        min_qty: 10,
        max_qty: 10,
      });

      results.success.push(product.name);
      console.log(
        `✅ [${i + 1}/${products.length}] ${product.name} - Created/Updated (ID: ${created.id})`
      );
    } catch (error) {
      const errorMessage = (error as Error).message;
      results.failed.push({ name: product.name, error: errorMessage });
      console.error(
        `❌ [${i + 1}/${products.length}] ${product.name} - Failed: ${errorMessage}`
      );
    }
  }

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
  console.log('\n✅ Spices seeder completed!');
}

// Run seeder
seedSpices()
  .then(() => {
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    return prisma.$disconnect().then(() => process.exit(1));
  });

