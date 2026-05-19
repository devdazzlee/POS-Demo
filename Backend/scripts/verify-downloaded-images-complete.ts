import * as fs from 'fs';
import * as path from 'path';

interface ImageInfo {
  name: string;
  url: string;
  uploadedAt?: string;
  format?: string;
}

async function verifyDownloadedImages() {
  console.log('🔍 Verifying Downloaded Images from February & March 2026...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Load expected images from Cloudinary JSON
  const jsonPath = path.resolve(__dirname, '../all-cloudinary-images-complete.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Image list file not found');
    process.exit(1);
  }
  
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const allImages: ImageInfo[] = jsonData.all || jsonData.images || [];
  
  // Filter to February and March 2026
  const febImages: ImageInfo[] = [];
  const marImages: ImageInfo[] = [];
  
  for (const img of allImages) {
    if (!img.uploadedAt) continue;
    
    const uploadDate = new Date(img.uploadedAt);
    const year = uploadDate.getFullYear();
    const month = uploadDate.getMonth() + 1; // 0-indexed, so add 1
    
    if (year === 2026 && month === 2) {
      febImages.push(img);
    } else if (year === 2026 && month === 3) {
      marImages.push(img);
    }
  }
  
  console.log('📊 Expected Images from Cloudinary:');
  console.log(`   February 2026: ${febImages.length} images`);
  console.log(`   March 2026: ${marImages.length} images`);
  console.log(`   Total Expected: ${febImages.length + marImages.length} images\n`);
  
  // Check downloaded files
  const downloadDir = path.resolve(__dirname, '../downloaded-images');
  const febDir = path.join(downloadDir, 'february-2026');
  const marDir = path.join(downloadDir, 'march-2026');
  
  let febFiles: string[] = [];
  let marFiles: string[] = [];
  
  if (fs.existsSync(febDir)) {
    febFiles = fs.readdirSync(febDir).filter(f => {
      const filePath = path.join(febDir, f);
      return fs.statSync(filePath).isFile() && 
             (f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg'));
    });
  }
  
  if (fs.existsSync(marDir)) {
    marFiles = fs.readdirSync(marDir).filter(f => {
      const filePath = path.join(marDir, f);
      return fs.statSync(filePath).isFile() && 
             (f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg'));
    });
  }
  
  console.log('📁 Downloaded Files:');
  console.log(`   February 2026: ${febFiles.length} files`);
  console.log(`   March 2026: ${marFiles.length} files`);
  console.log(`   Total Downloaded: ${febFiles.length + marFiles.length} files\n`);
  
  // Check file sizes
  let febTotalSize = 0;
  let marTotalSize = 0;
  let febValid = 0;
  let marValid = 0;
  
  for (const file of febFiles) {
    const filePath = path.join(febDir, file);
    const stats = fs.statSync(filePath);
    febTotalSize += stats.size;
    if (stats.size > 1000) febValid++;
  }
  
  for (const file of marFiles) {
    const filePath = path.join(marDir, file);
    const stats = fs.statSync(filePath);
    marTotalSize += stats.size;
    if (stats.size > 1000) marValid++;
  }
  
  console.log('📏 File Sizes:');
  console.log(`   February: ${(febTotalSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   March: ${(marTotalSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   Total: ${((febTotalSize + marTotalSize) / (1024 * 1024)).toFixed(2)} MB\n`);
  
  // Verify all images are downloaded
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ VERIFICATION RESULTS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const febMatch = febFiles.length === febImages.length;
  const marMatch = marFiles.length === marImages.length;
  const totalMatch = (febFiles.length + marFiles.length) === (febImages.length + marImages.length);
  
  if (febMatch) {
    console.log(`   ✅ February: ${febFiles.length}/${febImages.length} - ALL DOWNLOADED`);
  } else {
    console.log(`   ⚠️  February: ${febFiles.length}/${febImages.length} - MISSING ${febImages.length - febFiles.length}`);
  }
  
  if (marMatch) {
    console.log(`   ✅ March: ${marFiles.length}/${marImages.length} - ALL DOWNLOADED`);
  } else {
    console.log(`   ⚠️  March: ${marFiles.length}/${marImages.length} - MISSING ${marImages.length - marFiles.length}`);
  }
  
  if (totalMatch) {
    console.log(`   ✅ Total: ${febFiles.length + marFiles.length}/${febImages.length + marImages.length} - ALL DOWNLOADED`);
  } else {
    console.log(`   ⚠️  Total: ${febFiles.length + marFiles.length}/${febImages.length + marImages.length} - MISSING ${(febImages.length + marImages.length) - (febFiles.length + marFiles.length)}`);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (totalMatch && febValid === febFiles.length && marValid === marFiles.length) {
    console.log('🎉 SUCCESS! All images are downloaded and valid!\n');
  } else {
    if (!totalMatch) {
      console.log('⚠️  Some images are missing. Would you like me to re-download them?\n');
    }
    if (febValid < febFiles.length || marValid < marFiles.length) {
      console.log('⚠️  Some files may be corrupted (too small).\n');
    }
  }
}

verifyDownloadedImages().catch(console.error);
