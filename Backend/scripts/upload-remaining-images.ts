import { prisma } from '../src/prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

cloudinary.config({
  cloud_name: 'djadwzfwg',
  api_key: '199548153713428',
  api_secret: 'gdhzagnXsXDYGrVyEx8qjzzYktY',
});

const PRODUCTS_JSON = path.join(__dirname, '../../../Wordpress images/product_images/products_list.json');
const IMAGES_BASE_DIR = path.join(__dirname, '../../../Wordpress images');

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordsMatch(word1: string, word2: string): boolean {
  if (word1 === word2) return true;
  if (word1.includes(word2) || word2.includes(word1)) return true;
  const shorter = word1.length < word2.length ? word1 : word2;
  const longer = word1.length >= word2.length ? word1 : word2;
  if (shorter.length === 0) return false;
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  return matches / shorter.length > 0.7;
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  // Word-level matching
  const shorterWords = shorter.split(' ').filter(w => w.length > 2);
  const longerWords = longer.split(' ').filter(w => w.length > 2);
  
  if (shorterWords.length > 0 && longerWords.length > 0) {
    const matchingWords = shorterWords.filter(word => 
      longerWords.some(lword => wordsMatch(word, lword))
    );
    const wordMatchRatio = matchingWords.length / Math.max(shorterWords.length, longerWords.length);
    
    if (wordMatchRatio > 0.4) {
      return Math.max(0.5, wordMatchRatio * 0.9 + 0.2);
    }
  }
  
  // Substring match
  if (longer.includes(shorter)) {
    return Math.min(0.9, shorter.length / longer.length + 0.3);
  }
  
  // Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= longer.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= shorter.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= longer.length; i++) {
    for (let j = 1; j <= shorter.length; j++) {
      if (longer[i - 1] === shorter[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const distance = matrix[longer.length][shorter.length];
  return Math.max(0, 1 - distance / longer.length);
}

function findBestImage(
  productName: string,
  images: Array<{ name: string; filepath: string }>
): { image: { name: string; filepath: string } | null; score: number } {
  let bestMatch: { image: { name: string; filepath: string } | null; score: number } = {
    image: null,
    score: 0,
  };
  
  for (const img of images) {
    const score = calculateSimilarity(productName, img.name);
    if (score > bestMatch.score) {
      bestMatch = { image: img, score };
    }
  }
  
  return bestMatch;
}

async function uploadToCloudinary(filePath: string, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        public_id: publicId,
        folder: 'manpasand/products',
        overwrite: false,
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

async function main() {
  console.log('🚀 Uploading images for products without images...\n');
  
  await prisma.$connect();
  
  // Get products WITHOUT images
  const productsWithoutImages = await prisma.product.findMany({
    where: {
      is_active: true,
      has_images: false,
    },
    select: { id: true, name: true },
  });
  
  console.log(`📦 Found ${productsWithoutImages.length} products without images\n`);
  
  // Load available images
  const productsJson = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));
  const availableImages = productsJson.filter((p: any) => p.filepath && p.name);
  
  console.log(`📸 Available images: ${availableImages.length}\n`);
  console.log('🔍 Matching and uploading...\n');
  
  let uploaded = 0;
  let matched = 0;
  let skipped = 0;
  let failed = 0;
  const lowConfidence: Array<{ product: string; image: string; score: number }> = [];
  const noMatch: string[] = [];
  
  for (let i = 0; i < productsWithoutImages.length; i++) {
    const product = productsWithoutImages[i];
    const match = findBestImage(product.name, availableImages);
    
    if (!match.image || match.score < 0.4) {
      console.log(`⚠️  [${i + 1}/${productsWithoutImages.length}] No match for "${product.name}" (best: ${match.image?.name || 'none'}, score: ${match.score.toFixed(2)})`);
      noMatch.push(product.name);
      skipped++;
      continue;
    }
    
    // Check if image file exists
    let imagePath: string;
    if (match.image.filepath.startsWith('product_images/')) {
      imagePath = path.join(IMAGES_BASE_DIR, match.image.filepath);
    } else {
      imagePath = path.join(IMAGES_BASE_DIR, 'product_images', match.image.filepath);
    }
    
    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️  [${i + 1}/${productsWithoutImages.length}] Image file not found: ${match.image.filepath}`);
      skipped++;
      continue;
    }
    
    // Check if already uploaded
    const existingImage = await prisma.productImage.findFirst({
      where: {
        product_id: product.id,
        image: { contains: 'cloudinary' },
      },
    });
    
    if (existingImage) {
      skipped++;
      continue;
    }
    
    try {
      const publicId = product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      const confidence = match.score >= 0.7 ? '✅' : match.score >= 0.5 ? '⚠️' : '🔶';
      console.log(
        `${confidence} [${i + 1}/${productsWithoutImages.length}] "${product.name}" → "${match.image.name}" (${match.score.toFixed(2)})`
      );
      
      if (match.score < 0.6) {
        lowConfidence.push({
          product: product.name,
          image: match.image.name,
          score: match.score,
        });
      }
      
      const cloudinaryUrl = await uploadToCloudinary(imagePath, publicId);
      
      await prisma.productImage.create({
        data: {
          product_id: product.id,
          image: cloudinaryUrl,
          status: 'COMPLETE',
          is_active: true,
        },
      });
      
      await prisma.product.update({
        where: { id: product.id },
        data: { has_images: true },
      });
      
      uploaded++;
      matched++;
      
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }
  }
  
  // Final check
  const remaining = await prisma.product.count({
    where: {
      is_active: true,
      has_images: false,
    },
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Uploaded: ${uploaded}`);
  console.log(`✅ Matched: ${matched}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  No match found: ${noMatch.length}`);
  console.log(`🔶 Low confidence: ${lowConfidence.length}`);
  console.log(`\n📦 Products still without images: ${remaining}`);
  
  if (noMatch.length > 0 && noMatch.length <= 30) {
    console.log('\n⚠️  Products with no matching images:');
    noMatch.forEach((name, idx) => {
      console.log(`   ${idx + 1}. ${name}`);
    });
  }
  
  if (lowConfidence.length > 0 && lowConfidence.length <= 20) {
    console.log('\n🔶 Low confidence matches (please review):');
    lowConfidence.forEach((item, idx) => {
      console.log(`   ${idx + 1}. "${item.product}" → "${item.image}" (${item.score.toFixed(2)})`);
    });
  }
  
  console.log('\n✅ Done!');
  
  await prisma.$disconnect();
}

main().catch(console.error);

