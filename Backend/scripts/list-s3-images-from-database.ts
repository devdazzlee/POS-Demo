import { prisma } from '../src/prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

interface ImageInfo {
  productName: string;
  productId: string;
  imageUrl: string;
  imageId: string;
}

async function listS3ImagesFromDatabase() {
  console.log('🚀 Searching for AWS S3 images in database...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Get all product images
  const productImages = await prisma.productImage.findMany({
    include: {
      product: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });
  
  console.log(`📦 Found ${productImages.length} product images in database\n`);
  
  // Filter for S3 URLs
  const s3Images: ImageInfo[] = [];
  const s3Patterns = [
    /s3\.amazonaws\.com/,
    /s3-[^.]+\.amazonaws\.com/,
    /\.s3\./,
  ];
  
  for (const image of productImages) {
    const url = image.image;
    if (url && s3Patterns.some(pattern => pattern.test(url))) {
      s3Images.push({
        productName: image.product.name,
        productId: image.product.id,
        imageUrl: url,
        imageId: image.id,
      });
    }
  }
  
  console.log(`📸 Found ${s3Images.length} S3 images in database\n`);
  
  if (s3Images.length === 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   📦 AWS S3 images in database: 0');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('ℹ️  No S3 images found in the database.');
    console.log('   All images appear to be stored in Cloudinary.\n');
    return;
  }
  
  // Display S3 images
  console.log('📦 AWS S3 IMAGES FOUND IN DATABASE:\n');
  s3Images.forEach((img, index) => {
    console.log(`${index + 1}. ${img.productName}`);
    console.log(`   Product ID: ${img.productId}`);
    console.log(`   Image ID: ${img.imageId}`);
    console.log(`   URL: ${img.imageUrl}\n`);
  });
  
  // Save to JSON file
  const outputPath = path.resolve(__dirname, '../aws-s3-images-from-db.json');
  const outputData = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: s3Images.length,
    },
    images: s3Images,
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`💾 S3 images list saved to: ${outputPath}`);
  
  // Create a simple text file
  const textOutputPath = path.resolve(__dirname, '../aws-s3-images-from-db.txt');
  let textContent = `AWS S3 Images from Database - Generated: ${new Date().toISOString()}\n`;
  textContent += '='.repeat(80) + '\n\n';
  
  s3Images.forEach((img, index) => {
    textContent += `${index + 1}. ${img.productName}\n`;
    textContent += `   Product ID: ${img.productId}\n`;
    textContent += `   Image ID: ${img.imageId}\n`;
    textContent += `   URL: ${img.imageUrl}\n\n`;
  });
  
  fs.writeFileSync(textOutputPath, textContent);
  console.log(`📄 Simple text list saved to: ${textOutputPath}`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   📦 AWS S3 images in database: ${s3Images.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('✅ S3 image listing from database completed!');
}

listS3ImagesFromDatabase()
  .then(() => {
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    return prisma.$disconnect().then(() => process.exit(1));
  });
