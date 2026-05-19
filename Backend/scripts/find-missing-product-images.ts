import { prisma } from '../src/prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const PRODUCTS_JSON = path.join(__dirname, '../../../Wordpress images/product_images/products_list.json');

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordsMatch(word1: string, word2: string): boolean {
  if (word1 === word2) return true;
  if (word1.includes(word2) || word2.includes(word1)) return true;
  const shorter = word1.length < word2.length ? word1 : word2;
  const longer = word1.length >= word2.length ? word1 : word2;
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  return matches / shorter.length > 0.7;
}

function findBestMatch(
  productName: string,
  images: Array<{ name: string; filepath: string }>
): { image: { name: string; filepath: string } | null; score: number } {
  let bestMatch: { image: { name: string; filepath: string } | null; score: number } = {
    image: null,
    score: 0,
  };
  
  const productNorm = normalize(productName);
  const productWords = productNorm.split(' ').filter(w => w.length > 2);
  
  for (const img of images) {
    const imgNorm = normalize(img.name);
    const imgWords = imgNorm.split(' ').filter(w => w.length > 2);
    
    // Count matching words
    const matchingWords = productWords.filter(pw => 
      imgWords.some(iw => wordsMatch(pw, iw))
    );
    
    const wordScore = matchingWords.length / Math.max(productWords.length, imgWords.length);
    
    // Check substring match
    let substringScore = 0;
    if (productNorm.includes(imgNorm) || imgNorm.includes(productNorm)) {
      substringScore = Math.min(0.9, Math.min(productNorm.length, imgNorm.length) / Math.max(productNorm.length, imgNorm.length) + 0.3);
    }
    
    const score = Math.max(wordScore, substringScore);
    
    if (score > bestMatch.score) {
      bestMatch = { image: img, score };
    }
  }
  
  return bestMatch;
}

async function main() {
  console.log('🔍 Finding missing product images...\n');
  
  await prisma.$connect();
  
  // Get products without images
  const productsWithoutImages = await prisma.product.findMany({
    where: {
      is_active: true,
      has_images: false,
    },
    select: { id: true, name: true },
  });
  
  console.log(`📦 Found ${productsWithoutImages.length} products without images\n`);
  
  // Load all images from JSON
  const productsJson = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));
  const availableImages = productsJson.filter((p: any) => p.filepath && p.name);
  
  console.log(`📸 Available images: ${availableImages.length}\n`);
  console.log('🔍 Searching for matches...\n');
  
  const foundMatches: Array<{ product: string; image: string; score: number }> = [];
  const noMatches: string[] = [];
  
  for (const product of productsWithoutImages) {
    const match = findBestMatch(product.name, availableImages);
    
    if (match.image && match.score >= 0.3) {
      foundMatches.push({
        product: product.name,
        image: match.image.name,
        score: match.score,
      });
      console.log(`✅ "${product.name}" → "${match.image.name}" (${match.score.toFixed(2)})`);
    } else {
      noMatches.push(product.name);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Found matches: ${foundMatches.length}`);
  console.log(`❌ No matches found: ${noMatches.length}`);
  
  if (noMatches.length > 0) {
    console.log('\n❌ Products with no matching images:');
    noMatches.forEach((name, idx) => {
      console.log(`   ${idx + 1}. ${name}`);
    });
  }
  
  if (foundMatches.length > 0) {
    console.log('\n✅ Potential matches found (can be uploaded):');
    foundMatches
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .forEach((match, idx) => {
        console.log(`   ${idx + 1}. "${match.product}" → "${match.image}" (${match.score.toFixed(2)})`);
      });
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);

