import { prisma } from '../src/prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

interface ImageInfo {
  name: string;
  url: string;
  size?: number;
  format?: string;
  folder?: string;
  uploadedAt?: string;
}

// Helper function to normalize names for matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // Replace special characters with spaces
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .trim();
}

// Alternative normalization that keeps words separate
function normalizeNameWords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // Replace special characters with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
    .split(' ')
    .filter(w => w.length > 0);
}

// Helper function to extract product name from image path
function extractProductNameFromImage(imageName: string): string {
  // Remove folder prefix (e.g., "manpasand/products/")
  const parts = imageName.split('/');
  const fileName = parts[parts.length - 1];
  
  // Remove file extension
  const nameWithoutExt = fileName.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
  
  return nameWithoutExt;
}

// Calculate similarity between two strings (simple Levenshtein-like)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeName(str1);
  const s2 = normalizeName(str2);
  
  if (s1 === s2) return 1.0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }
  
  // Simple word matching
  const words1 = s1.split('_');
  const words2 = s2.split('_');
  const commonWords = words1.filter(w => words2.includes(w));
  const totalWords = Math.max(words1.length, words2.length);
  
  if (totalWords === 0) return 0;
  return commonWords.length / totalWords;
}

async function updateProductImages() {
  console.log('🚀 Starting product image update from Cloudinary list...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Load images from JSON
  const jsonPath = path.resolve(__dirname, '../all-images-list.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ JSON file not found: ${jsonPath}`);
    process.exit(1);
  }
  
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const allImages: ImageInfo[] = [
    ...(jsonData.cloudinary?.all || []),
    ...(jsonData.cloudinary?.byFolder?.['manpasand/products'] || []),
    ...(jsonData.cloudinary?.byFolder?.['products'] || []),
  ];
  
  // Remove duplicates based on URL
  const uniqueImages = Array.from(
    new Map(allImages.map(img => [img.url, img])).values()
  );
  
  console.log(`📸 Loaded ${uniqueImages.length} unique images from JSON\n`);
  
  // Get all products from database
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      code: true,
    },
  });
  
  console.log(`📦 Found ${products.length} products in database\n`);
  
  // Create a map of normalized product names to images
  const imageMap = new Map<string, ImageInfo[]>();
  for (const image of uniqueImages) {
    const productName = extractProductNameFromImage(image.name);
    const normalized = normalizeName(productName);
    
    if (!imageMap.has(normalized)) {
      imageMap.set(normalized, []);
    }
    imageMap.get(normalized)!.push(image);
  }
  
  const results = {
    updated: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    matched: [] as Array<{ product: string; image: string }>,
    unmatched: [] as string[],
  };
  
  console.log('🔄 Matching products with images...\n');
  
  // Process each product
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const normalizedProductName = normalizeName(product.name);
    
    // Try multiple matching strategies
    let matchedImage: ImageInfo | null = null;
    let matchScore = 0;
    
    // Strategy 1: Exact normalized match
    if (imageMap.has(normalizedProductName)) {
      const images = imageMap.get(normalizedProductName)!;
      matchedImage = images[0];
      matchScore = 1.0;
    } else {
      // Strategy 2: Try matching with product name words
      const productWords = normalizeNameWords(product.name);
      let bestMatch: ImageInfo | null = null;
      let bestScore = 0;
      
      for (const [imageName, images] of imageMap.entries()) {
        const imageWords = normalizeNameWords(imageName);
        
        // Check if all product words are in image name
        const allWordsMatch = productWords.every(pw => 
          imageWords.some(iw => iw.includes(pw) || pw.includes(iw))
        );
        
        if (allWordsMatch && productWords.length > 0) {
          const score = productWords.filter(pw => 
            imageWords.some(iw => iw === pw)
          ).length / Math.max(productWords.length, imageWords.length);
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = images[0];
          }
        }
        
        // Also try similarity matching
        const similarity = calculateSimilarity(product.name, imageName);
        if (similarity > bestScore && similarity >= 0.5) {
          bestScore = Math.max(bestScore, similarity);
          bestMatch = images[0];
        }
      }
      
      if (bestMatch && bestScore >= 0.5) {
        matchedImage = bestMatch;
        matchScore = bestScore;
      }
    }
    
    if (matchedImage) {
      try {
        // Check if product already has an image
        const existingImage = await prisma.productImage.findFirst({
          where: { product_id: product.id },
        });
        
        if (existingImage) {
          // Update existing image
          await prisma.productImage.update({
            where: { id: existingImage.id },
            data: {
              image: matchedImage.url,
              status: 'COMPLETE',
              is_active: true,
            },
          });
          results.updated++;
        } else {
          // Create new image record
          await prisma.productImage.create({
            data: {
              product_id: product.id,
              image: matchedImage.url,
              status: 'COMPLETE',
              is_active: true,
            },
          });
          results.created++;
        }
        
        // Update product has_images flag
        await prisma.product.update({
          where: { id: product.id },
          data: { has_images: true },
        });
        
        results.matched.push({
          product: product.name,
          image: matchedImage.name,
        });
        
        const matchType = matchScore === 1.0 ? '✅' : '🔍';
        console.log(
          `${matchType} [${i + 1}/${products.length}] ${product.name} → ${extractProductNameFromImage(matchedImage.name)} (score: ${(matchScore * 100).toFixed(0)}%)`
        );
      } catch (error) {
        results.failed++;
        console.error(`❌ [${i + 1}/${products.length}] ${product.name} - Error: ${(error as Error).message}`);
      }
    } else {
      results.skipped++;
      results.unmatched.push(product.name);
      if (results.unmatched.length <= 20) {
        console.log(`⏭️  [${i + 1}/${products.length}] ${product.name} - No matching image found`);
      }
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   ✅ Updated: ${results.updated} products`);
  console.log(`   ➕ Created: ${results.created} products`);
  console.log(`   ⏭️  Skipped: ${results.skipped} products (no match)`);
  console.log(`   ❌ Failed: ${results.failed} products`);
  console.log(`   📈 Total matched: ${results.matched.length} products`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (results.unmatched.length > 0) {
    console.log(`\n⚠️  Products without matching images (${results.unmatched.length}):`);
    if (results.unmatched.length <= 50) {
      results.unmatched.forEach(name => console.log(`   - ${name}`));
    } else {
      results.unmatched.slice(0, 50).forEach(name => console.log(`   - ${name}`));
      console.log(`   ... and ${results.unmatched.length - 50} more`);
    }
  }
  
  // Save unmatched products to file
  if (results.unmatched.length > 0) {
    const unmatchedPath = path.resolve(__dirname, '../unmatched-products.txt');
    fs.writeFileSync(unmatchedPath, results.unmatched.join('\n'));
    console.log(`\n💾 Unmatched products list saved to: ${unmatchedPath}`);
  }
  
  console.log('\n✅ Product image update completed!');
}

updateProductImages()
  .then(() => {
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    return prisma.$disconnect().then(() => process.exit(1));
  });
