import * as fs from 'fs';
import * as path from 'path';

interface ImageInfo {
  name: string;
  url: string;
  size?: number;
  format?: string;
  folder?: string;
  uploadedAt?: string;
}

async function filterFebMarImages() {
  console.log('🔍 Filtering images to only include February and March 2026...\n');
  
  // Load the complete image list
  const completePath = path.resolve(__dirname, '../all-cloudinary-images-complete.json');
  if (!fs.existsSync(completePath)) {
    console.error(`❌ Complete image file not found: ${completePath}`);
    process.exit(1);
  }
  
  const completeData = JSON.parse(fs.readFileSync(completePath, 'utf-8'));
  const allImages: ImageInfo[] = completeData.all || completeData.images || [];
  
  console.log(`📦 Total images in complete list: ${allImages.length}`);
  
  // Filter to only February and March 2026
  const filteredImages = allImages.filter(img => {
    if (!img.uploadedAt) return false;
    const uploadDate = new Date(img.uploadedAt);
    const year = uploadDate.getFullYear();
    const month = uploadDate.getMonth() + 1; // 0-indexed, so add 1
    
    // Include February (month 2) and March (month 3) of 2026
    return year === 2026 && (month === 2 || month === 3);
  });
  
  console.log(`✅ Filtered to February & March 2026: ${filteredImages.length} images\n`);
  
  // Group by month for summary
  const byMonth: { [key: string]: number } = {};
  filteredImages.forEach(img => {
    if (img.uploadedAt) {
      const month = img.uploadedAt.substring(0, 7); // YYYY-MM
      byMonth[month] = (byMonth[month] || 0) + 1;
    }
  });
  
  console.log('📅 Images by month:');
  Object.keys(byMonth).sort().forEach(month => {
    console.log(`   ${month}: ${byMonth[month]} images`);
  });
  console.log('');
  
  // Organize by folder for the output format
  const byFolder: { [folder: string]: ImageInfo[] } = {};
  filteredImages.forEach(img => {
    const folder = img.folder || 'root';
    if (!byFolder[folder]) {
      byFolder[folder] = [];
    }
    byFolder[folder].push(img);
  });
  
  // Create output in the format expected by update script
  const outputData = {
    generatedAt: new Date().toISOString(),
    summary: {
      cloudinary: filteredImages.length,
      s3: 0,
      total: filteredImages.length,
    },
    cloudinary: {
      byFolder: byFolder,
      all: filteredImages,
    },
    s3: {
      byFolder: {},
      all: [],
    },
  };
  
  // Save to all-images-list.json
  const outputPath = path.resolve(__dirname, '../all-images-list.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  
  console.log(`💾 Filtered image list saved to: ${outputPath}`);
  console.log(`📊 Total images: ${filteredImages.length}`);
  console.log(`   - February 2026: ${byMonth['2026-02'] || 0}`);
  console.log(`   - March 2026: ${byMonth['2026-03'] || 0}`);
  console.log(`\n✅ Ready to match images to products!\n`);
}

filterFebMarImages().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
