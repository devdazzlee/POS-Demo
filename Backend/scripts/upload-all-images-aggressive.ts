import { prisma } from '../src/prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'djadwzfwg',
  api_key: '199548153713428',
  api_secret: 'gdhzagnXsXDYGrVyEx8qjzzYktY',
});

const IMAGES_DIR = path.join(__dirname, '../../../Wordpress images/product_images');
const PRODUCTS_JSON = path.join(IMAGES_DIR, 'products_list.json');
const IMAGES_BASE_DIR = path.join(__dirname, '../../../Wordpress images');

// Improved similarity function
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Simple word comparison (no recursion)
function wordsMatch(word1: string, word2: string): boolean {
  if (word1 === word2) return true;
  if (word1.includes(word2) || word2.includes(word1)) return true;
  // Check if words are similar (at least 70% of shorter word matches)
  const shorter = word1.length < word2.length ? word1 : word2;
  const longer = word1.length >= word2.length ? word1 : word2;
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  return matches / shorter.length > 0.7;
}

function similarity(str1: string, str2: string): number {
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  if (s1.replace(/\s/g, '') === s2.replace(/\s/g, '')) return 0.98;
  
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
    
    if (wordMatchRatio > 0.3) {
      return Math.max(0.4, wordMatchRatio * 0.9 + 0.2);
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

function findBestMatch(
  imageName: string,
  products: Array<{ id: string; name: string }>
): { product: { id: string; name: string } | null; score: number } {
  let bestMatch: { product: { id: string; name: string } | null; score: number } = {
    product: null,
    score: 0,
  };
  
  const cleanImageName = imageName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]/g, ' ')
    .trim();
  
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from']);
  const imageWords = cleanImageName
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !commonWords.has(w));
  
  for (const product of products) {
    let score = similarity(cleanImageName, product.name);
    
    const productWords = product.name
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !commonWords.has(w));
    
    if (imageWords.length > 0 && productWords.length > 0) {
      const matchingWords = imageWords.filter(iw => 
        productWords.some(pw => wordsMatch(iw, pw))
      );
      const wordMatchRatio = matchingWords.length / Math.max(imageWords.length, productWords.length);
      
      if (wordMatchRatio > 0.3) {
        score = Math.max(score, wordMatchRatio * 0.8 + 0.2);
      }
      if (wordMatchRatio >= 0.6) {
        score = Math.max(score, 0.65);
      }
    }
    
    if (score > bestMatch.score) {
      bestMatch = { product, score };
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
  console.log('🚀 Starting AGGRESSIVE image upload to Cloudinary...\n');
  
  await prisma.$connect();
  console.log('✅ Connected to database\n');
  
  // Load products from JSON
  console.log('📄 Loading products from JSON...');
  const productsJson = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));
  console.log(`✅ Loaded ${productsJson.length} products from JSON\n`);
  
  // Get all products from database (including those without images)
  console.log('📦 Fetching products from database...');
  const dbProducts = await prisma.product.findMany({
    where: { is_active: true },
    select: { id: true, name: true, has_images: true },
  });
  console.log(`✅ Found ${dbProducts.length} products in database\n`);
  
  // Get products without images
  const productsWithoutImages = dbProducts.filter(p => !p.has_images);
  console.log(`📊 Products without images: ${productsWithoutImages.length}\n`);
  
  // Process each image with VERY lenient matching (threshold: 0.3)
  let uploaded = 0;
  let matched = 0;
  let skipped = 0;
  let failed = 0;
  const unmatched: Array<{ image: string; bestMatch: string; score: number }> = [];
  const lowConfidence: Array<{ image: string; product: string; score: number }> = [];
  
  console.log('📸 Processing images with AGGRESSIVE matching (threshold: 0.3)...\n');
  
  for (let i = 0; i < productsJson.length; i++) {
    const productData = productsJson[i];
    
    if (!productData.filepath || !productData.name) {
      skipped++;
      continue;
    }
    
    let imagePath: string;
    if (productData.filepath.startsWith('product_images/')) {
      imagePath = path.join(IMAGES_BASE_DIR, productData.filepath);
    } else {
      imagePath = path.join(IMAGES_BASE_DIR, 'product_images', productData.filepath);
    }
    
    if (!fs.existsSync(imagePath)) {
      skipped++;
      continue;
    }
    
    // Find best match
    const match = findBestMatch(productData.name, dbProducts);
    
    // Lenient threshold but with validation - accept 0.35 (35% similarity)
    // But also check if it's a reasonable match (not just random words)
    if (!match.product || match.score < 0.35) {
      unmatched.push({
        image: productData.name,
        bestMatch: match.product?.name || 'none',
        score: match.score,
      });
      skipped++;
      continue;
    }
    
    // Additional validation: if score is low (< 0.5), check if key words match
    if (match.score < 0.5) {
      const productWords = normalize(match.product.name).split(' ').filter(w => w.length > 3);
      const imageWords = normalize(productData.name).split(' ').filter(w => w.length > 3);
      const keyWordMatches = productWords.filter(pw => 
        imageWords.some(iw => wordsMatch(pw, iw))
      );
      
      // If less than 30% of key words match, skip (likely wrong match)
      if (keyWordMatches.length / Math.max(productWords.length, imageWords.length) < 0.3) {
        console.log(`   ⚠️  Skipping low-quality match: "${productData.name}" → "${match.product.name}" (${match.score.toFixed(2)})`);
        unmatched.push({
          image: productData.name,
          bestMatch: match.product.name,
          score: match.score,
        });
        skipped++;
        continue;
      }
    }
    
    // Check if product already has image
    const existingImage = await prisma.productImage.findFirst({
      where: {
        product_id: match.product.id,
        image: { contains: 'cloudinary' },
      },
    });
    
    if (existingImage) {
      skipped++;
      continue;
    }
    
    try {
      const publicId = match.product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      const confidence = match.score >= 0.6 ? '✅' : match.score >= 0.4 ? '⚠️' : '🔶';
      console.log(
        `${confidence} [${i + 1}/${productsJson.length}] "${productData.name}" → "${match.product.name}" (${match.score.toFixed(2)})`
      );
      
      if (match.score < 0.5) {
        lowConfidence.push({
          image: productData.name,
          product: match.product.name,
          score: match.score,
        });
      }
      
      const cloudinaryUrl = await uploadToCloudinary(imagePath, publicId);
      
      await prisma.productImage.create({
        data: {
          product_id: match.product.id,
          image: cloudinaryUrl,
          status: 'COMPLETE',
          is_active: true,
        },
      });
      
      await prisma.product.update({
        where: { id: match.product.id },
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
  
  // Check which products still don't have images
  const remainingWithoutImages = await prisma.product.findMany({
    where: {
      is_active: true,
      has_images: false,
    },
    select: { id: true, name: true },
  });
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Uploaded: ${uploaded}`);
  console.log(`✅ Matched: ${matched}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Unmatched: ${unmatched.length}`);
  console.log(`🔶 Low confidence matches: ${lowConfidence.length}`);
  console.log(`\n📦 Products still without images: ${remainingWithoutImages.length}`);
  
  if (remainingWithoutImages.length > 0 && remainingWithoutImages.length <= 50) {
    console.log('\n📋 Products still needing images:');
    remainingWithoutImages.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.name}`);
    });
  }
  
  if (lowConfidence.length > 0 && lowConfidence.length <= 30) {
    console.log('\n🔶 Low confidence matches (please review):');
    lowConfidence
      .sort((a, b) => a.score - b.score)
      .slice(0, 30)
      .forEach((item) => {
        console.log(`   - "${item.image}" → "${item.product}" (${item.score.toFixed(2)})`);
      });
  }
  
  console.log('\n✅ Done!');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

