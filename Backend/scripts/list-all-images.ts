import { v2 as cloudinary } from 'cloudinary';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djadwzfwg',
  api_key: process.env.CLOUDINARY_API_KEY || '199548153713428',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'gdhzagnXsXDYGrVyEx8qjzzYktY',
});

// Configure S3
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

interface ImageInfo {
  name: string;
  url: string;
  size?: number;
  format?: string;
  folder?: string;
  uploadedAt?: Date;
}

async function listCloudinaryImages(): Promise<ImageInfo[]> {
  console.log('\n📸 Fetching images from Cloudinary...\n');
  const images: ImageInfo[] = [];
  
  try {
    // First, get ALL images without folder restriction to ensure we don't miss any
    console.log('  Fetching ALL images from Cloudinary (no folder restriction)...');
    try {
      let nextCursor: string | undefined = undefined;
      let hasMore = true;
      let totalFetched = 0;
      let pageCount = 0;
      
      while (hasMore) {
        pageCount++;
        const params: any = {
          type: 'upload',
          resource_type: 'image',
          max_results: 500, // Maximum allowed by Cloudinary
        };
        
        if (nextCursor) {
          params.next_cursor = nextCursor;
        }
        
        const result: any = await cloudinary.api.resources(params);
        
        if (result.resources && result.resources.length > 0) {
          const pageImages = result.resources.length;
          for (const resource of result.resources) {
            // Use URL as unique identifier to avoid duplicates
            if (!images.find(img => img.url === resource.secure_url)) {
              images.push({
                name: resource.public_id,
                url: resource.secure_url,
                size: resource.bytes,
                format: resource.format,
                folder: resource.folder || 'root',
                uploadedAt: new Date(resource.created_at),
              });
              totalFetched++;
            }
          }
          console.log(`    Page ${pageCount}: Fetched ${pageImages} images (total: ${totalFetched})...`);
        } else {
          console.log(`    Page ${pageCount}: No images found`);
        }
        
        // Check if there are more pages
        nextCursor = result.next_cursor;
        hasMore = !!nextCursor;
        
        // If we got fewer than max_results, we might be at the end, but check cursor anyway
        if (result.resources && result.resources.length < 500) {
          // Still check if there's a cursor - sometimes Cloudinary returns cursor even with fewer results
          if (!nextCursor) {
            hasMore = false;
          }
        }
        
        // Small delay to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      console.log(`  ✓ Fetched ${totalFetched} images from all folders (${pageCount} pages)\n`);
    } catch (error: any) {
      console.log(`  ⚠️  Error fetching all resources: ${error.message}`);
      console.log('  Trying folder-based approach...\n');
      
      // Fallback: List images by folder
      const commonFolders = ['manpasand/products', 'manpasand/categories', 'products', 'categories'];
      
      for (const folder of commonFolders) {
        try {
          let nextCursor: string | undefined = undefined;
          let hasMore = true;
          let folderCount = 0;
          
          while (hasMore) {
            const params: any = {
              type: 'upload',
              prefix: folder,
              max_results: 500,
            };
            
            if (nextCursor) {
              params.next_cursor = nextCursor;
            }
            
            const result: any = await cloudinary.api.resources(params);
            
            if (result.resources && result.resources.length > 0) {
              for (const resource of result.resources) {
                if (!images.find(img => img.url === resource.secure_url)) {
                  images.push({
                    name: resource.public_id,
                    url: resource.secure_url,
                    size: resource.bytes,
                    format: resource.format,
                    folder: folder,
                    uploadedAt: new Date(resource.created_at),
                  });
                  folderCount++;
                }
              }
            }
            
            nextCursor = result.next_cursor;
            hasMore = !!nextCursor && result.resources && result.resources.length > 0;
          }
          
          if (folderCount > 0) {
            console.log(`  ✓ Folder "${folder}": ${folderCount} images`);
          }
        } catch (folderError: any) {
          if (!folderError.message?.includes('not found')) {
            console.log(`  ⚠️  Error checking folder "${folder}": ${folderError.message}`);
          }
        }
      }
    }
    
    console.log(`\n✅ Found ${images.length} images in Cloudinary\n`);
  } catch (error: any) {
    console.error(`❌ Error fetching Cloudinary images: ${error.message}`);
  }
  
  return images;
}

async function listS3Images(): Promise<ImageInfo[]> {
  console.log('\n📦 Fetching images from AWS S3...\n');
  const images: ImageInfo[] = [];
  
  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName) {
    console.log('⚠️  BUCKET_NAME not set in environment variables, skipping S3');
    return images;
  }
  
  try {
    let continuationToken: string | undefined = undefined;
    let hasMore = true;
    
    while (hasMore) {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });
      
      const response: any = await s3.send(command);
      
      if (response.Contents && response.Contents.length > 0) {
        for (const object of response.Contents) {
          if (object.Key) {
            const region = process.env.AWS_REGION || 'eu-north-1';
            const url = `https://${bucketName}.s3.${region}.amazonaws.com/${object.Key}`;
            
            images.push({
              name: object.Key,
              url: url,
              size: object.Size,
              format: object.Key.split('.').pop()?.toLowerCase(),
              folder: object.Key.includes('/') ? object.Key.substring(0, object.Key.lastIndexOf('/')) : 'root',
              uploadedAt: object.LastModified,
            });
          }
        }
      }
      
      continuationToken = response.NextContinuationToken;
      hasMore = !!continuationToken;
    }
    
    console.log(`✅ Found ${images.length} images in S3\n`);
  } catch (error: any) {
    console.error(`❌ Error fetching S3 images: ${error.message}`);
    if (error.message?.includes('credentials')) {
      console.log('   Make sure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set');
    }
  }
  
  return images;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return 'Unknown';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function main() {
  console.log('🚀 Starting image listing from Cloudinary and AWS S3...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Fetch images from both services
  const [cloudinaryImages, s3Images] = await Promise.all([
    listCloudinaryImages(),
    listS3Images(),
  ]);
  
  // Combine and organize results
  const allImages = {
    cloudinary: cloudinaryImages,
    s3: s3Images,
    total: cloudinaryImages.length + s3Images.length,
  };
  
  // Display summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   📸 Cloudinary: ${cloudinaryImages.length} images`);
  console.log(`   📦 AWS S3: ${s3Images.length} images`);
  console.log(`   📈 Total: ${allImages.total} images`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Group by folder
  const cloudinaryByFolder: { [key: string]: ImageInfo[] } = {};
  cloudinaryImages.forEach(img => {
    const folder = img.folder || 'root';
    if (!cloudinaryByFolder[folder]) {
      cloudinaryByFolder[folder] = [];
    }
    cloudinaryByFolder[folder].push(img);
  });
  
  const s3ByFolder: { [key: string]: ImageInfo[] } = {};
  s3Images.forEach(img => {
    const folder = img.folder || 'root';
    if (!s3ByFolder[folder]) {
      s3ByFolder[folder] = [];
    }
    s3ByFolder[folder].push(img);
  });
  
  // Display Cloudinary images by folder
  if (cloudinaryImages.length > 0) {
    console.log('\n📸 CLOUDINARY IMAGES BY FOLDER:\n');
    Object.keys(cloudinaryByFolder).sort().forEach(folder => {
      const folderImages = cloudinaryByFolder[folder];
      console.log(`   📁 ${folder} (${folderImages.length} images):`);
      folderImages.slice(0, 10).forEach(img => {
        const name = img.name.split('/').pop() || img.name;
        console.log(`      • ${name} (${formatBytes(img.size)}, ${img.format || 'unknown'})`);
        console.log(`        ${img.url}`);
      });
      if (folderImages.length > 10) {
        console.log(`      ... and ${folderImages.length - 10} more`);
      }
      console.log('');
    });
  }
  
  // Display S3 images by folder
  if (s3Images.length > 0) {
    console.log('\n📦 AWS S3 IMAGES BY FOLDER:\n');
    Object.keys(s3ByFolder).sort().forEach(folder => {
      const folderImages = s3ByFolder[folder];
      console.log(`   📁 ${folder} (${folderImages.length} images):`);
      folderImages.slice(0, 10).forEach(img => {
        const name = img.name.split('/').pop() || img.name;
        console.log(`      • ${name} (${formatBytes(img.size)}, ${img.format || 'unknown'})`);
        console.log(`        ${img.url}`);
      });
      if (folderImages.length > 10) {
        console.log(`      ... and ${folderImages.length - 10} more`);
      }
      console.log('');
    });
  }
  
  // Save to JSON file
  const outputPath = path.resolve(__dirname, '../all-images-list.json');
  const outputData = {
    generatedAt: new Date().toISOString(),
    summary: {
      cloudinary: cloudinaryImages.length,
      s3: s3Images.length,
      total: allImages.total,
    },
    cloudinary: {
      byFolder: cloudinaryByFolder,
      all: cloudinaryImages.map(img => ({
        name: img.name,
        url: img.url,
        size: img.size,
        format: img.format,
        folder: img.folder,
        uploadedAt: img.uploadedAt?.toISOString(),
      })),
    },
    s3: {
      byFolder: s3ByFolder,
      all: s3Images.map(img => ({
        name: img.name,
        url: img.url,
        size: img.size,
        format: img.format,
        folder: img.folder,
        uploadedAt: img.uploadedAt?.toISOString(),
      })),
    },
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`\n💾 Full list saved to: ${outputPath}`);
  
  // Create a simple text file with just names and URLs
  const textOutputPath = path.resolve(__dirname, '../all-images-list.txt');
  let textContent = `All Images List - Generated: ${new Date().toISOString()}\n`;
  textContent += '='.repeat(80) + '\n\n';
  
  textContent += `CLOUDINARY IMAGES (${cloudinaryImages.length}):\n`;
  textContent += '-'.repeat(80) + '\n';
  cloudinaryImages.forEach((img, index) => {
    textContent += `${index + 1}. ${img.name}\n`;
    textContent += `   URL: ${img.url}\n`;
    textContent += `   Size: ${formatBytes(img.size)}, Format: ${img.format || 'unknown'}, Folder: ${img.folder || 'root'}\n\n`;
  });
  
  textContent += `\nAWS S3 IMAGES (${s3Images.length}):\n`;
  textContent += '-'.repeat(80) + '\n';
  s3Images.forEach((img, index) => {
    textContent += `${index + 1}. ${img.name}\n`;
    textContent += `   URL: ${img.url}\n`;
    textContent += `   Size: ${formatBytes(img.size)}, Format: ${img.format || 'unknown'}, Folder: ${img.folder || 'root'}\n\n`;
  });
  
  fs.writeFileSync(textOutputPath, textContent);
  console.log(`📄 Simple text list saved to: ${textOutputPath}`);
  
  console.log('\n✅ Image listing completed!');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
