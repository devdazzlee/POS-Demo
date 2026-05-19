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

// Path to downloaded images (relative to Backend folder)
// Backend is at: Manpasand-Pos-/Backend
// Images are at: Wordpress images/product_images
const IMAGES_DIR = path.join(__dirname, '../../../Wordpress images/product_images');
const PRODUCTS_JSON = path.join(IMAGES_DIR, 'products_list.json');
const IMAGES_BASE_DIR = path.join(__dirname, '../../../Wordpress images');

// Normalize string for comparison
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// String similarity function (improved)
function similarity(str1: string, str2: string): number {
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  // Exact match after normalization
  if (s1.replace(/\s/g, '') === s2.replace(/\s/g, '')) return 0.98;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  // Check if shorter string is contained in longer (word-level)
  const shorterWords = shorter.split(' ').filter(w => w.length > 2);
  const longerWords = longer.split(' ').filter(w => w.length > 2);
  
  if (shorterWords.length > 0) {
    const matchingWords = shorterWords.filter(word => 
      longerWords.some(lword => lword.includes(word) || word.includes(lword))
    );
    if (matchingWords.length === shorterWords.length && shorterWords.length >= 2) {
      return 0.85; // High score for word-level match
    }
    if (matchingWords.length > 0) {
      const wordMatchScore = matchingWords.length / Math.max(shorterWords.length, longerWords.length);
      if (wordMatchScore > 0.6) return wordMatchScore * 0.9; // Boost for word matches
    }
  }
  
  // Check substring match
  if (longer.includes(shorter)) {
    return Math.min(0.9, shorter.length / longer.length + 0.3);
  }
  
  // Calculate Levenshtein distance
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
  const baseScore = 1 - distance / longer.length;
  
  // Boost score if significant portion matches
  return Math.max(0, baseScore);
}

// Find best matching product for an image filename
function findBestMatch(
  imageName: string,
  products: Array<{ id: string; name: string }>
): { product: { id: string; name: string } | null; score: number } {
  let bestMatch: { product: { id: string; name: string } | null; score: number } = {
    product: null,
    score: 0,
  };
  
  // Clean image name (remove extension, replace underscores/hyphens with spaces)
  const cleanImageName = imageName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[_-]/g, ' ')
    .trim();
  
  // Extract key words from image name (remove common words)
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from']);
  const imageWords = cleanImageName
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !commonWords.has(w));
  
  for (const product of products) {
    let score = similarity(cleanImageName, product.name);
    
    // Boost score if key words match
    const productWords = product.name
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !commonWords.has(w));
    
    if (imageWords.length > 0 && productWords.length > 0) {
      const matchingWords = imageWords.filter(iw => 
        productWords.some(pw => pw.includes(iw) || iw.includes(pw) || similarity(iw, pw) > 0.7)
      );
      const wordMatchRatio = matchingWords.length / Math.max(imageWords.length, productWords.length);
      
      // Boost score if significant word overlap
      if (wordMatchRatio > 0.3) {
        score = Math.max(score, wordMatchRatio * 0.8 + 0.2);
      }
      
      // Extra boost if most words match
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

// Upload image to Cloudinary
async function uploadToCloudinary(
  filePath: string,
  publicId: string
): Promise<string> {
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

// Main function
async function main() {
  console.log('🚀 Starting image upload to Cloudinary...\n');
  
  // Connect to database
  await prisma.$connect();
  console.log('✅ Connected to database\n');
  
  // Load products from JSON
  console.log('📄 Loading products from JSON...');
  if (!fs.existsSync(PRODUCTS_JSON)) {
    throw new Error(`Products JSON not found at: ${PRODUCTS_JSON}`);
  }
  const productsJson = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));
  console.log(`✅ Loaded ${productsJson.length} products from JSON\n`);
  
  // Get all products from database
  console.log('📦 Fetching products from database...');
  const dbProducts = await prisma.product.findMany({
    where: { is_active: true },
    select: { id: true, name: true },
  });
  console.log(`✅ Found ${dbProducts.length} products in database\n`);
  
  // Process each image
  let uploaded = 0;
  let matched = 0;
  let skipped = 0;
  let failed = 0;
  const unmatched: Array<{ image: string; bestMatch: string; score: number }> = [];
  
  console.log('📸 Processing images...\n');
  
  for (let i = 0; i < productsJson.length; i++) {
    const productData = productsJson[i];
    
    // Skip if no filepath or name
    if (!productData.filepath || !productData.name) {
      console.log(`⚠️  [${i + 1}/${productsJson.length}] Missing filepath or name, skipping...`);
      skipped++;
      continue;
    }
    
    // Handle filepath - it might be relative or absolute
    let imagePath: string;
    if (productData.filepath.startsWith('product_images/')) {
      imagePath = path.join(IMAGES_BASE_DIR, productData.filepath);
    } else {
      imagePath = path.join(IMAGES_BASE_DIR, 'product_images', productData.filepath);
    }
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️  [${i + 1}/${productsJson.length}] File not found: ${productData.filepath}`);
      skipped++;
      continue;
    }
    
    // Find best matching product in database
    const match = findBestMatch(productData.name, dbProducts);
    
    // Very lenient threshold - accept matches with score >= 0.4 (40% similarity)
    // This will catch more products even with partial name matches
    if (!match.product || match.score < 0.4) {
      console.log(
        `⚠️  [${i + 1}/${productsJson.length}] No match for "${productData.name}" (best: ${match.product?.name || 'none'}, score: ${match.score.toFixed(2)})`
      );
      unmatched.push({
        image: productData.name,
        bestMatch: match.product?.name || 'none',
        score: match.score,
      });
      skipped++;
      continue;
    }
    
    // Warn if match is low confidence but still proceed
    if (match.score < 0.6) {
      console.log(
        `⚠️  [${i + 1}/${productsJson.length}] Low confidence match: "${productData.name}" → "${match.product.name}" (score: ${match.score.toFixed(2)})`
      );
    }
    
    // Check if product already has this image
    const existingImage = await prisma.productImage.findFirst({
      where: {
        product_id: match.product.id,
        image: { contains: 'cloudinary' },
      },
    });
    
    if (existingImage) {
      console.log(
        `⏭️  [${i + 1}/${productsJson.length}] Product "${match.product.name}" already has image (score: ${match.score.toFixed(2)})`
      );
      skipped++;
      continue;
    }
    
    try {
      // Create public ID from product name (folder is set in upload options, so just use name)
      const publicId = match.product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      console.log(
        `📤 [${i + 1}/${productsJson.length}] Uploading "${productData.name}" → "${match.product.name}" (score: ${match.score.toFixed(2)})...`
      );
      
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(imagePath, publicId);
      
      // Save to database
      await prisma.productImage.create({
        data: {
          product_id: match.product.id,
          image: cloudinaryUrl,
          status: 'COMPLETE',
          is_active: true,
        },
      });
      
      // Update product has_images flag
      await prisma.product.update({
        where: { id: match.product.id },
        data: { has_images: true },
      });
      
      uploaded++;
      matched++;
      console.log(`   ✅ Uploaded: ${cloudinaryUrl}\n`);
      
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
      failed++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Uploaded: ${uploaded}`);
  console.log(`✅ Matched: ${matched}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Unmatched: ${unmatched.length}`);
  
  if (unmatched.length > 0 && unmatched.length <= 20) {
    console.log('\n⚠️  Unmatched products (low similarity scores):');
    unmatched
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .forEach((item) => {
        console.log(`   - "${item.image}" → "${item.bestMatch}" (${item.score.toFixed(2)})`);
      });
  }
  
  console.log('\n✅ Done!');
}

// Run
main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

