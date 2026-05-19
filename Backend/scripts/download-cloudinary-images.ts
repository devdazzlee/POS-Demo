import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

interface ImageInfo {
  name: string;
  url: string;
  size?: number;
  format?: string;
  folder?: string;
  uploadedAt?: string;
}

async function downloadFile(url: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(filePath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        return downloadFile(response.headers.location!, filePath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filePath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      reject(err);
    });
  });
}

async function downloadCloudinaryImages() {
  console.log('📥 Downloading Cloudinary Images from February & March 2026...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Load images from JSON
  const jsonPath = path.resolve(__dirname, '../all-cloudinary-images-complete.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Image list file not found:', jsonPath);
    process.exit(1);
  }
  
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const allImages: ImageInfo[] = jsonData.all || jsonData.images || [];
  
  console.log(`📦 Total images in file: ${allImages.length}\n`);
  
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
  
  console.log(`📅 Filtered images:`);
  console.log(`   February 2026: ${febImages.length} images`);
  console.log(`   March 2026: ${marImages.length} images\n`);
  
  // Create download directories
  const downloadDir = path.resolve(__dirname, '../downloaded-images');
  const febDir = path.join(downloadDir, 'february-2026');
  const marDir = path.join(downloadDir, 'march-2026');
  
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }
  if (!fs.existsSync(febDir)) {
    fs.mkdirSync(febDir, { recursive: true });
  }
  if (!fs.existsSync(marDir)) {
    fs.mkdirSync(marDir, { recursive: true });
  }
  
  console.log(`📁 Download directories created:`);
  console.log(`   February: ${febDir}`);
  console.log(`   March: ${marDir}\n`);
  
  // Download February images
  console.log('📥 Downloading February 2026 images...\n');
  let febDownloaded = 0;
  let febFailed = 0;
  
  for (let i = 0; i < febImages.length; i++) {
    const img = febImages[i];
    let fileName = img.name.split('/').pop() || `image-${i}`;
    
    // Remove existing extension if present
    fileName = fileName.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
    
    // Get proper extension
    let extension = img.format || path.extname(img.url).split('?')[0].split('.')[1] || 'jpg';
    if (!extension.startsWith('.')) {
      extension = '.' + extension;
    }
    
    const filePath = path.join(febDir, `${fileName}${extension}`);
    
    // Skip if already downloaded
    if (fs.existsSync(filePath)) {
      febDownloaded++;
      if ((i + 1) % 20 === 0) {
        console.log(`   Progress: ${i + 1}/${febImages.length} (${febDownloaded} downloaded, ${febFailed} failed)`);
      }
      continue;
    }
    
    try {
      await downloadFile(img.url, filePath);
      febDownloaded++;
      
      if ((i + 1) % 10 === 0 || i === febImages.length - 1) {
        console.log(`   [${i + 1}/${febImages.length}] Downloaded: ${fileName}${extension}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      febFailed++;
      console.error(`   ❌ Failed to download ${fileName}: ${(error as Error).message}`);
    }
  }
  
  console.log(`\n✅ February downloads complete: ${febDownloaded} downloaded, ${febFailed} failed\n`);
  
  // Download March images
  console.log('📥 Downloading March 2026 images...\n');
  let marDownloaded = 0;
  let marFailed = 0;
  
  for (let i = 0; i < marImages.length; i++) {
    const img = marImages[i];
    let fileName = img.name.split('/').pop() || `image-${i}`;
    
    // Remove existing extension if present
    fileName = fileName.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
    
    // Get proper extension
    let extension = img.format || path.extname(img.url).split('?')[0].split('.')[1] || 'jpg';
    if (!extension.startsWith('.')) {
      extension = '.' + extension;
    }
    
    const filePath = path.join(marDir, `${fileName}${extension}`);
    
    // Skip if already downloaded
    if (fs.existsSync(filePath)) {
      marDownloaded++;
      if ((i + 1) % 20 === 0) {
        console.log(`   Progress: ${i + 1}/${marImages.length} (${marDownloaded} downloaded, ${marFailed} failed)`);
      }
      continue;
    }
    
    try {
      await downloadFile(img.url, filePath);
      marDownloaded++;
      
      if ((i + 1) % 10 === 0 || i === marImages.length - 1) {
        console.log(`   [${i + 1}/${marImages.length}] Downloaded: ${fileName}${extension}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      marFailed++;
      console.error(`   ❌ Failed to download ${fileName}: ${(error as Error).message}`);
    }
  }
  
  console.log(`\n✅ March downloads complete: ${marDownloaded} downloaded, ${marFailed} failed\n`);
  
  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 DOWNLOAD SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   February 2026: ${febDownloaded}/${febImages.length} downloaded (${febFailed} failed)`);
  console.log(`   March 2026: ${marDownloaded}/${marImages.length} downloaded (${marFailed} failed)`);
  console.log(`   Total: ${febDownloaded + marDownloaded}/${febImages.length + marImages.length} downloaded`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`💾 Images saved to:`);
  console.log(`   ${febDir}`);
  console.log(`   ${marDir}\n`);
  
  console.log('✅ Download completed!\n');
}

downloadCloudinaryImages().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
