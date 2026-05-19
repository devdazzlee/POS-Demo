import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djadwzfwg',
  api_key: process.env.CLOUDINARY_API_KEY || '199548153713428',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'gdhzagnXsXDYGrVyEx8qjzzYktY',
});

interface ImageInfo {
  name: string;
  url: string;
  size?: number;
  format?: string;
  folder?: string;
  uploadedAt?: Date;
}

async function downloadFile(url: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(filePath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location!, filePath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
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

async function getAllCloudinaryImages2026() {
  console.log('📥 Fetching ALL images from Cloudinary (Jan, Feb, Mar 2026)...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const images: ImageInfo[] = [];
  const seenUrls = new Set<string>();
  
  try {
    console.log('📸 Fetching all images from Cloudinary...\n');
    
    let nextCursor: string | undefined = undefined;
    let hasMore = true;
    let pageCount = 0;
    
    while (hasMore) {
      pageCount++;
      try {
        const params: any = {
          type: 'upload',
          resource_type: 'image',
          max_results: 500,
        };
        
        if (nextCursor) {
          params.next_cursor = nextCursor;
        }
        
        const result: any = await cloudinary.api.resources(params);
        
        if (result.resources && result.resources.length > 0) {
          for (const resource of result.resources) {
            if (!seenUrls.has(resource.secure_url)) {
              seenUrls.add(resource.secure_url);
              images.push({
                name: resource.public_id,
                url: resource.secure_url,
                size: resource.bytes,
                format: resource.format,
                folder: resource.folder || 'root',
                uploadedAt: new Date(resource.created_at),
              });
            }
          }
          console.log(`   Page ${pageCount}: ${result.resources.length} images (total: ${images.length})`);
        }
        
        nextCursor = result.next_cursor;
        hasMore = !!nextCursor;
        
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (pageError: any) {
        console.error(`   Error on page ${pageCount}: ${pageError.message}`);
        hasMore = false;
      }
    }
    
    console.log(`\n✅ Fetched ${images.length} total images from Cloudinary\n`);
    
    // Filter to January, February, and March 2026
    const janImages: ImageInfo[] = [];
    const febImages: ImageInfo[] = [];
    const marImages: ImageInfo[] = [];
    
    for (const img of images) {
      if (!img.uploadedAt) continue;
      
      const uploadDate = img.uploadedAt;
      const year = uploadDate.getFullYear();
      const month = uploadDate.getMonth() + 1; // 0-indexed, so add 1
      
      if (year === 2026) {
        if (month === 1) {
          janImages.push(img);
        } else if (month === 2) {
          febImages.push(img);
        } else if (month === 3) {
          marImages.push(img);
        }
      }
    }
    
    console.log('📅 Filtered by Month:');
    console.log(`   January 2026: ${janImages.length} images`);
    console.log(`   February 2026: ${febImages.length} images`);
    console.log(`   March 2026: ${marImages.length} images`);
    console.log(`   Total 2026 (Jan-Mar): ${janImages.length + febImages.length + marImages.length} images\n`);
    
    // Create download directories
    const downloadDir = path.resolve(__dirname, '../downloaded-images-2026');
    const janDir = path.join(downloadDir, 'january-2026');
    const febDir = path.join(downloadDir, 'february-2026');
    const marDir = path.join(downloadDir, 'march-2026');
    
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    if (!fs.existsSync(janDir)) {
      fs.mkdirSync(janDir, { recursive: true });
    }
    if (!fs.existsSync(febDir)) {
      fs.mkdirSync(febDir, { recursive: true });
    }
    if (!fs.existsSync(marDir)) {
      fs.mkdirSync(marDir, { recursive: true });
    }
    
    console.log(`📁 Download directories created:\n`);
    console.log(`   January: ${janDir}`);
    console.log(`   February: ${febDir}`);
    console.log(`   March: ${marDir}\n`);
    
    // Download January images
    if (janImages.length > 0) {
      console.log('📥 Downloading January 2026 images...\n');
      let janDownloaded = 0;
      let janFailed = 0;
      
      for (let i = 0; i < janImages.length; i++) {
        const img = janImages[i];
        let fileName = img.name.split('/').pop() || `image-${i}`;
        fileName = fileName.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
        
        let extension = img.format || 'jpg';
        if (!extension.startsWith('.')) {
          extension = '.' + extension;
        }
        
        const filePath = path.join(janDir, `${fileName}${extension}`);
        
        if (fs.existsSync(filePath)) {
          janDownloaded++;
          continue;
        }
        
        try {
          await downloadFile(img.url, filePath);
          janDownloaded++;
          
          if ((i + 1) % 10 === 0 || i === janImages.length - 1) {
            console.log(`   [${i + 1}/${janImages.length}] Downloaded: ${fileName}${extension}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          janFailed++;
          console.error(`   ❌ Failed: ${fileName}: ${(error as Error).message}`);
        }
      }
      
      console.log(`\n✅ January: ${janDownloaded}/${janImages.length} downloaded (${janFailed} failed)\n`);
    } else {
      console.log('📥 January 2026: No images found\n');
    }
    
    // Download February images
    if (febImages.length > 0) {
      console.log('📥 Downloading February 2026 images...\n');
      let febDownloaded = 0;
      let febFailed = 0;
      
      for (let i = 0; i < febImages.length; i++) {
        const img = febImages[i];
        let fileName = img.name.split('/').pop() || `image-${i}`;
        fileName = fileName.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
        
        let extension = img.format || 'jpg';
        if (!extension.startsWith('.')) {
          extension = '.' + extension;
        }
        
        const filePath = path.join(febDir, `${fileName}${extension}`);
        
        if (fs.existsSync(filePath)) {
          febDownloaded++;
          continue;
        }
        
        try {
          await downloadFile(img.url, filePath);
          febDownloaded++;
          
          if ((i + 1) % 10 === 0 || i === febImages.length - 1) {
            console.log(`   [${i + 1}/${febImages.length}] Downloaded: ${fileName}${extension}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          febFailed++;
          console.error(`   ❌ Failed: ${fileName}: ${(error as Error).message}`);
        }
      }
      
      console.log(`\n✅ February: ${febDownloaded}/${febImages.length} downloaded (${febFailed} failed)\n`);
    } else {
      console.log('📥 February 2026: No images found\n');
    }
    
    // Download March images
    if (marImages.length > 0) {
      console.log('📥 Downloading March 2026 images...\n');
      let marDownloaded = 0;
      let marFailed = 0;
      
      for (let i = 0; i < marImages.length; i++) {
        const img = marImages[i];
        let fileName = img.name.split('/').pop() || `image-${i}`;
        fileName = fileName.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
        
        let extension = img.format || 'jpg';
        if (!extension.startsWith('.')) {
          extension = '.' + extension;
        }
        
        const filePath = path.join(marDir, `${fileName}${extension}`);
        
        if (fs.existsSync(filePath)) {
          marDownloaded++;
          continue;
        }
        
        try {
          await downloadFile(img.url, filePath);
          marDownloaded++;
          
          if ((i + 1) % 10 === 0 || i === marImages.length - 1) {
            console.log(`   [${i + 1}/${marImages.length}] Downloaded: ${fileName}${extension}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          marFailed++;
          console.error(`   ❌ Failed: ${fileName}: ${(error as Error).message}`);
        }
      }
      
      console.log(`\n✅ March: ${marDownloaded}/${marImages.length} downloaded (${marFailed} failed)\n`);
    } else {
      console.log('📥 March 2026: No images found\n');
    }
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DOWNLOAD SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   January 2026: ${janImages.length} images`);
    console.log(`   February 2026: ${febImages.length} images`);
    console.log(`   March 2026: ${marImages.length} images`);
    console.log(`   Total: ${janImages.length + febImages.length + marImages.length} images`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`💾 Images saved to:`);
    console.log(`   ${janDir}`);
    console.log(`   ${febDir}`);
    console.log(`   ${marDir}\n`);
    
    console.log('✅ Download completed!\n');
    
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

getAllCloudinaryImages2026().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
