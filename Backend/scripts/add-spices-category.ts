import { prisma } from '../src/prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'djadwzfwg',
  api_key: '199548153713428',
  api_secret: 'gdhzagnXsXDYGrVyEx8qjzzYktY',
});

const IMAGE_PATH = path.resolve(__dirname, '../seeder_images/spices/spice_main_category.PNG');
const CATEGORY_NAME = 'Spices';
const CATEGORY_SLUG = 'spices';

async function addSpicesCategory() {
  console.log('🌶️  Adding Spices category with image...\n');

  // Check image exists
  if (!fs.existsSync(IMAGE_PATH)) {
    console.error(`❌ Image not found at: ${IMAGE_PATH}`);
    process.exit(1);
  }
  console.log(`✅ Image found at: ${IMAGE_PATH}`);

  // Check if category already exists
  let category = await prisma.category.findFirst({
    where: { name: { equals: CATEGORY_NAME, mode: 'insensitive' } },
  });

  if (category) {
    console.log(`ℹ️  Category "${CATEGORY_NAME}" already exists (ID: ${category.id})`);
  } else {
    // Generate new code
    const lastCategory = await prisma.category.findFirst({
      orderBy: { created_at: 'desc' },
      select: { code: true },
    });

    const newCode = lastCategory
      ? (parseInt(lastCategory.code) + 1).toString()
      : '1000';

    // Create the category
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
    console.log(`✅ Created category "${CATEGORY_NAME}" (ID: ${category.id}, Code: ${newCode})`);
  }

  // Upload image to Cloudinary
  const publicId = 'spices_category';
  console.log(`\n📤 Uploading image to Cloudinary...`);

  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload(
      IMAGE_PATH,
      {
        public_id: publicId,
        folder: 'manpasand/categories',
        overwrite: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });

  const cloudinaryUrl = result.secure_url;
  console.log(`✅ Uploaded to Cloudinary: ${cloudinaryUrl}\n`);

  // Update category image field
  await prisma.category.update({
    where: { id: category.id },
    data: { image: cloudinaryUrl },
  });
  console.log(`✅ Updated category "image" field`);

  // Check if CategoryImages record already exists
  const existingCategoryImage = await prisma.categoryImages.findFirst({
    where: { category_id: category.id },
  });

  if (existingCategoryImage) {
    // Update existing record
    await prisma.categoryImages.update({
      where: { id: existingCategoryImage.id },
      data: {
        image: cloudinaryUrl,
        status: 'COMPLETE',
        is_active: true,
      },
    });
    console.log(`✅ Updated existing CategoryImages record`);
  } else {
    // Create new record
    await prisma.categoryImages.create({
      data: {
        category_id: category.id,
        image: cloudinaryUrl,
        status: 'COMPLETE',
        is_active: true,
      },
    });
    console.log(`✅ Created CategoryImages record`);
  }

  console.log(`\n🎉 Done! Category "${CATEGORY_NAME}" is ready with the image.`);
}

addSpicesCategory()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

