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

const IMAGE_PATH = path.resolve(__dirname, '../seeder_images/dried_fruit_nuts/dried_fruit_nuts_category.jpeg');
const CATEGORY_NAME = 'Dried Fruits & Nuts';

async function uploadCategoryImage() {
  console.log('📸 Uploading category image to Cloudinary...\n');

  // Check image exists
  if (!fs.existsSync(IMAGE_PATH)) {
    console.error(`❌ Image not found at: ${IMAGE_PATH}`);
    console.log('   Please save the image to: seeder_images/dried_fruit_nuts_category.jpg');
    process.exit(1);
  }

  // Find the category
  const category = await prisma.category.findFirst({
    where: { name: { equals: CATEGORY_NAME, mode: 'insensitive' } },
  });

  if (!category) {
    console.error(`❌ Category "${CATEGORY_NAME}" not found in database.`);
    process.exit(1);
  }

  console.log(`✅ Found category: ${category.name} (ID: ${category.id})`);

  // Upload to Cloudinary
  const publicId = 'dried_fruits_nuts_category';
  console.log(`📤 Uploading image to Cloudinary...`);

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

  // Also create a CategoryImages record
  await prisma.categoryImages.create({
    data: {
      category_id: category.id,
      image: cloudinaryUrl,
      status: 'COMPLETE',
      is_active: true,
    },
  });
  console.log(`✅ Created CategoryImages record`);

  console.log(`\n🎉 Done! Category "${CATEGORY_NAME}" now has the image.`);
}

uploadCategoryImage()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
