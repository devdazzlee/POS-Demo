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

const PRODUCTS_JSON = path.resolve(__dirname, '../image-seeder/spices_products.json');
const CATEGORY_IMAGE_PATH = path.resolve(__dirname, '../seeder_images/spices/spice_main_category.PNG');

interface SpiceProduct {
  name: string;
  unit: string;
  category: string;
  selling_price: number;
  image_link: string;
}

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
        if (error) reject(error);
        else resolve(result?.secure_url || '');
      }
    );
  });
}

async function seedSpicesFromJson() {
  console.log('🌶️  Starting Spices seeder from JSON (with category image for all products)...\n');

  // Check files exist
  if (!fs.existsSync(PRODUCTS_JSON)) {
    console.error(`❌ Products JSON not found at: ${PRODUCTS_JSON}`);
    process.exit(1);
  }
  if (!fs.existsSync(CATEGORY_IMAGE_PATH)) {
    console.error(`❌ Category image not found at: ${CATEGORY_IMAGE_PATH}`);
    process.exit(1);
  }

  // Load products from JSON
  const products: SpiceProduct[] = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));
  console.log(`✅ Loaded ${products.length} products from JSON\n`);

  // Upload the main category image ONCE to Cloudinary (for use on all products)
  console.log(`📤 Uploading spice category image to Cloudinary (will be used for all products)...`);
  const categoryImageUrl = await uploadToCloudinary(CATEGORY_IMAGE_PATH, 'spices_main', 'manpasand/products');
  console.log(`✅ Category image uploaded: ${categoryImageUrl}\n`);

  const productService = new ProductService();
  const results = {
    success: [] as string[],
    failed: [] as { name: string; error: string }[],
    imagesSet: 0,
  };

  console.log(`📦 Processing ${products.length} spice products...\n`);

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    try {
      // Handle selling price
      let sellingPrice = product.selling_price > 0 ? product.selling_price : 100;
      let purchaseRate = Math.round(sellingPrice * 0.7);

      // Create or update product
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
      console.log(`✅ [${i + 1}/${products.length}] ${product.name} - Created (ID: ${created.id})`);

      // Set the category image as product image
      try {
        const existingImage = await prisma.productImage.findFirst({
          where: { product_id: created.id },
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
          await prisma.productImage.create({
            data: {
              product_id: created.id,
              image: categoryImageUrl,
              status: 'COMPLETE',
              is_active: true,
            },
          });
        }

        // Update product has_images flag
        await prisma.product.update({
          where: { id: created.id },
          data: { has_images: true },
        });

        results.imagesSet++;
        console.log(`   📸 Image set for ${product.name}`);
      } catch (imgError) {
        console.error(`   ⚠️  Image failed for ${product.name}: ${(imgError as Error).message}`);
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      results.failed.push({ name: product.name, error: errorMessage });
      console.error(`❌ [${i + 1}/${products.length}] ${product.name} - Failed: ${errorMessage}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   ✅ Products created/updated: ${results.success.length}`);
  console.log(`   📸 Product images set: ${results.imagesSet}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed products:');
    results.failed.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🎉 Spices seeder completed!');
}

// Run seeder
seedSpicesFromJson()
  .then(() => {
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    return prisma.$disconnect().then(() => process.exit(1));
  });

