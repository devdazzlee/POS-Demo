import { ProductService } from '../src/services/product.service';
import { prisma } from '../src/prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

interface ProductInput {
    name: string;
    unit: string;
  category?: string;
    selling_price: number;
}

const CATEGORY_NAME = 'Grains, Pulses & Rice';
const CATEGORY_SLUG = 'grains-pulses-rice';
const JSON_PATH = path.resolve(__dirname, '../seeder_with_images/grains_pulses_rice.json');
const IMAGE_PATH = path.resolve(__dirname, '../seeder_images/grains_pulses_rice/main_category_image.jpeg');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djadwzfwg',
  api_key: process.env.CLOUDINARY_API_KEY || '199548153713428',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'gdhzagnXsXDYGrVyEx8qjzzYktY',
});

function loadProducts(): ProductInput[] {
  if (!fs.existsSync(JSON_PATH)) {
    throw new Error(`Products file not found: ${JSON_PATH}`);
  }
  const raw = fs.readFileSync(JSON_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as ProductInput[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Products JSON is empty or invalid');
  }
  return parsed;
}

async function ensureCategoryWithImage(): Promise<{ categoryId: string; imageUrl: string }> {
  if (!fs.existsSync(IMAGE_PATH)) {
    throw new Error(`Category image not found: ${IMAGE_PATH}`);
  }

  // Find by slug first to avoid duplicates with similar names.
  let category = await prisma.category.findUnique({
    where: { slug: CATEGORY_SLUG },
  });

  if (!category) {
    const lastCategory = await prisma.category.findFirst({
      orderBy: { created_at: 'desc' },
      select: { code: true },
    });

    const newCode = lastCategory ? (parseInt(lastCategory.code) + 1).toString() : '1000';

    category = await prisma.category.create({
      data: {
        name: CATEGORY_NAME,
        slug: CATEGORY_SLUG,
        code: newCode,
        is_active: true,
        display_on_pos: true,
        display_on_branches: [],
      },
    });
    console.log(`✅ Created category "${CATEGORY_NAME}" (ID: ${category.id})`);
  } else {
    console.log(`ℹ️ Category "${CATEGORY_NAME}" already exists (ID: ${category.id}), updating image...`);
  }

  const uploadResult = await cloudinary.uploader.upload(IMAGE_PATH, {
    public_id: 'grains_pulses_rice_category',
    folder: 'manpasand/categories',
    overwrite: true,
    resource_type: 'image',
  });

  const imageUrl = uploadResult.secure_url;

  await prisma.category.update({
    where: { id: category.id },
    data: { image: imageUrl },
  });

  const existingImage = await prisma.categoryImages.findFirst({
    where: { category_id: category.id },
  });

  if (existingImage) {
    await prisma.categoryImages.update({
      where: { id: existingImage.id },
      data: {
        image: imageUrl,
        status: 'COMPLETE',
        is_active: true,
      },
    });
  } else {
    await prisma.categoryImages.create({
      data: {
        category_id: category.id,
        image: imageUrl,
        status: 'COMPLETE',
        is_active: true,
      },
    });
  }

  console.log(`✅ Category image updated: ${imageUrl}`);
  return { categoryId: category.id, imageUrl };
}

async function addGrainsPulsesRiceProducts() {
    const productService = new ProductService();
  const products = loadProducts();
  const { categoryId, imageUrl } = await ensureCategoryWithImage();

    const results = {
        success: [] as string[],
        failed: [] as { name: string; error: string }[],
    };

  console.log(`🚀 Starting to add ${products.length} products to "${CATEGORY_NAME}"...\n`);

    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        try {
      // Always force this new category; do not use incoming category values.
      const sellingPrice =
        typeof product.selling_price === 'number' && product.selling_price > 0
                ? product.selling_price 
          : 100;
      const purchaseRate = Math.max(Math.round(sellingPrice * 0.7), 50);

            const created = await productService.createProductFromBulkUpload({
                name: product.name,
        category_name: CATEGORY_NAME,
                unit_name: product.unit,
                purchase_rate: purchaseRate,
                sales_rate_exc_dis_and_tax: sellingPrice,
                sales_rate_inc_dis_and_tax: sellingPrice,
                min_qty: 10,
                max_qty: 10,
            });

      // Ensure all products in this category also have the main category image.
      const existingProductImage = await prisma.productImage.findFirst({
        where: { product_id: created.id, image: imageUrl },
      });

      if (!existingProductImage) {
        await prisma.productImage.create({
          data: {
            product_id: created.id,
            image: imageUrl,
            status: 'COMPLETE',
            is_active: true,
          },
        });
      }

      await prisma.product.update({
        where: { id: created.id },
        data: {
          category_id: categoryId,
          has_images: true,
        },
      });

            results.success.push(product.name);
      console.log(`✅ [${i + 1}/${products.length}] ${product.name} - Upserted (ID: ${created.id})`);
        } catch (error) {
            const errorMessage = (error as Error).message;
            results.failed.push({ name: product.name, error: errorMessage });
            console.error(`❌ [${i + 1}/${products.length}] ${product.name} - Failed: ${errorMessage}`);
        }
    }

    console.log('\n📊 Summary:');
  console.log(`   ✅ Success: ${results.success.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
        console.log('\n❌ Failed products:');
        results.failed.forEach(({ name, error }) => {
            console.log(`   - ${name}: ${error}`);
        });
    }
}

addGrainsPulsesRiceProducts()
    .then(() => {
        console.log('\n✅ Process completed!');
        return prisma.$disconnect();
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });

