import * as fs from 'fs';
import * as path from 'path';

interface ImageInfo {
  name: string;
  url: string;
  uploadedAt?: string;
  format?: string;
}

async function verifyDownloadedImages() {
  console.log('🔍 Verifying All Downloaded Images from February & March 2026...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Load images from JSON
  const jsonPath = path.resolve(__dirname, '../all-cloudinary-images-complete.json');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const allImages: ImageInfo[] = jsonData.all || jsonData.images || [];
  
  // Filter to February and March 2026
  const febImages: ImageInfo[] = [];
  const marImages: ImageInfo[] = [];
  
  for (const img of allImages) {
    if (!img.uploadedAt) continue;
    
    const uploadDate = new Date(img.uploadedAt);
    const year = uploadDate.getFullYear();
    const month = uploadDate.getMonth() + 1;
    
    if (year === 2026 && month === 2) {
      febImages.push(img);
    } else if (year === 2026 && month === 3) {
      marImages.push(img);
    }
  }
  
  console.log(`📊 Expected Images from Cloudinary:`);
  console.log(`   February 2026: ${febImages.length} images`);
  console.log(`   March 2026: ${marImages.length} images`);
  console.log(`   Total: ${febImages.length + marImages.length} images\n`);
  
  // Check downloaded files
  const downloadDir = path.resolve(__dirname, '../downloaded-images');
  const febDir = path.join(downloadDir, 'february-2026');
  const marDir = path.join(downloadDir, 'march-2026');
  
  console.log('📁 Checking Downloaded Files...\n');
  
  // February files
  let febFiles: string[] = [];
  if (fs.existsSync(febDir)) {
    febFiles = fs.readdirSync(febDir).filter(f => {
      const filePath = path.join(febDir, f);
      return fs.statSync(filePath).isFile();
    });
  }
  
  // March files
  let marFiles: string[] = [];
  if (fs.existsSync(marDir)) {
    marFiles = fs.readdirSync(marDir).filter(f => {
      const filePath = path.join(marDir, f);
      return fs.statSync(filePath).isFile();
    });
  }
  
  console.log(`📦 Downloaded Files:`);
  console.log(`   February 2026: ${febFiles.length} files`);
  console.log(`   March 2026: ${marFiles.length} files`);
  console.log(`   Total: ${febFiles.length + marFiles.length} files\n`);
  
  // Verify file sizes
  console.log('📏 Checking File Sizes...\n');
  
  let febTotalSize = 0;
  let marTotalSize = 0;
  let febValidFiles = 0;
  let marValidFiles = 0;
  let febInvalidFiles: string[] = [];
  let marInvalidFiles: string[] = [];
  
  for (const file of febFiles) {
    const filePath = path.join(febDir, file);
    const stats = fs.statSync(filePath);
    febTotalSize += stats.size;
    
    // Check if file is valid (not empty, reasonable size)
    if (stats.size > 1000) { // At least 1KB
      febValidFiles++;
    } else {
      febInvalidFiles.push(file);
    }
  }
  
  for (const file of marFiles) {
    const filePath = path.join(marDir, file);
    const stats = fs.statSync(filePath);
    marTotalSize += stats.size;
    
    // Check if file is valid (not empty, reasonable size)
    if (stats.size > 1000) { // At least 1KB
      marValidFiles++;
    } else {
      marInvalidFiles.push(file);
    }
  }
  
  console.log(`   February: ${febValidFiles} valid files, ${febInvalidFiles.length} invalid`);
  console.log(`   March: ${marValidFiles} valid files, ${marInvalidFiles.length} invalid`);
  console.log(`   Total size: ${((febTotalSize + marTotalSize) / (1024 * 1024)).toFixed(2)} MB\n`);
  
  // Check for missing images
  console.log('🔍 Checking for Missing Images...\n');
  
  const febMissing: string[] = [];
  const marMissing: string[] = [];
  
  for (const img of febImages) {
    const fileName = img.name.split('/').pop() || '';
    const extension = img.format || 'jpg';
    const expectedFile = `${fileName}.${extension}`;
    
    if (!febFiles.some(f => f.includes(fileName))) {
      febMissing.push(img.name);
    }
  }
  
  for (const img of marImages) {
    const fileName = img.name.split('/').pop() || '';
    const extension = img.format || 'jpg';
    const expectedFile = `${fileName}.${extension}`;
    
    if (!marFiles.some(f => f.includes(fileName))) {
      marMissing.push(img.name);
    }
  }
  
  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 VERIFICATION SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Expected: ${febImages.length + marImages.length} images`);
  console.log(`   Downloaded: ${febFiles.length + marFiles.length} files`);
  console.log(`   Valid files: ${febValidFiles + marValidFiles}`);
  console.log(`   Missing: ${febMissing.length + marMissing.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (febMissing.length > 0) {
    console.log(`⚠️  Missing February images (${febMissing.length}):`);
    febMissing.slice(0, 10).forEach(name => console.log(`   - ${name}`));
    if (febMissing.length > 10) {
      console.log(`   ... and ${febMissing.length - 10} more`);
    }
    console.log('');
  }
  
  if (marMissing.length > 0) {
    console.log(`⚠️  Missing March images (${marMissing.length}):`);
    marMissing.slice(0, 10).forEach(name => console.log(`   - ${name}`));
    if (marMissing.length > 10) {
      console.log(`   ... and ${marMissing.length - 10} more`);
    }
    console.log('');
  }
  
  if (febInvalidFiles.length > 0) {
    console.log(`⚠️  Invalid February files (${febInvalidFiles.length}):`);
    febInvalidFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');
  }
  
  if (marInvalidFiles.length > 0) {
    console.log(`⚠️  Invalid March files (${marInvalidFiles.length}):`);
    marInvalidFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');
  }
  
  if (febMissing.length === 0 && marMissing.length === 0 && febInvalidFiles.length === 0 && marInvalidFiles.length === 0) {
    console.log('✅ All images downloaded successfully and are valid!\n');
  }
  
  // List all files by category
  console.log('📋 File Breakdown:\n');
  
  const febByType: { [key: string]: number } = {};
  const marByType: { [key: string]: number } = {};
  
  febFiles.forEach(f => {
    const ext = path.extname(f).toLowerCase();
    febByType[ext] = (febByType[ext] || 0) + 1;
  });
  
  marFiles.forEach(f => {
    const ext = path.extname(f).toLowerCase();
    marByType[ext] = (marByType[ext] || 0) + 1;
  });
  
  console.log('   February 2026:');
  Object.keys(febByType).sort().forEach(ext => {
    console.log(`      ${ext || 'no extension'}: ${febByType[ext]} files`);
  });
  
  console.log('\n   March 2026:');
  Object.keys(marByType).sort().forEach(ext => {
    console.log(`      ${ext || 'no extension'}: ${marByType[ext]} files`);
  });
  
  console.log('');
}

verifyDownloadedImages().catch(console.error);
