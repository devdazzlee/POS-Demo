import { v2 as cloudinary } from 'cloudinary';
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

interface ImageInfo {
  name: string;
  url: string;
  size?: number;
  format?: string;
  folder?: string;
  uploadedAt?: Date;
}

async function getAllCloudinaryImages(): Promise<ImageInfo[]> {
  console.log('🚀 Fetching ALL images from Cloudinary (comprehensive method)...\n');
  const images: ImageInfo[] = [];
  const seenUrls = new Set<string>();
  
  try {
    // Method 1: Use Admin API to get all resources
    console.log('📸 Method 1: Using Admin API resources()...');
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
    
    console.log(`   ✓ Method 1: Found ${images.length} images\n`);
    
    // Method 2: Check specific folders that might have recent uploads
    console.log('\n📸 Method 3: Checking specific folders for recent uploads...');
    const foldersToCheck = [
      'manpasand/products',
      'manpasand/categories', 
      'products',
      'categories',
      'manpasand',
    ];
    
    for (const folder of foldersToCheck) {
      try {
        let folderCursor: string | undefined = undefined;
        let folderHasMore = true;
        let folderCount = 0;
        
        while (folderHasMore) {
          const folderParams: any = {
            type: 'upload',
            prefix: folder,
            max_results: 500,
          };
          
          if (folderCursor) {
            folderParams.next_cursor = folderCursor;
          }
          
          const folderResult: any = await cloudinary.api.resources(folderParams);
          
          if (folderResult.resources && folderResult.resources.length > 0) {
            for (const resource of folderResult.resources) {
              if (!seenUrls.has(resource.secure_url)) {
                seenUrls.add(resource.secure_url);
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
          
          folderCursor = folderResult.next_cursor;
          folderHasMore = !!folderCursor;
          
          if (folderHasMore) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        if (folderCount > 0) {
          console.log(`   ✓ Folder "${folder}": ${folderCount} new images`);
        }
      } catch (folderError: any) {
        // Skip folders that don't exist
      }
    }
    
    console.log(`\n✅ Total unique images found: ${images.length}\n`);
    
    // Show date distribution
    const byMonth: { [key: string]: number } = {};
    images.forEach(img => {
      if (img.uploadedAt) {
        const month = img.uploadedAt.toISOString().substring(0, 7); // YYYY-MM
        byMonth[month] = (byMonth[month] || 0) + 1;
      }
    });
    
    console.log('📅 Images by month:');
    Object.keys(byMonth).sort().forEach(month => {
      console.log(`   ${month}: ${byMonth[month]} images`);
    });
    console.log('');
    
  } catch (error: any) {
    console.error(`❌ Error fetching Cloudinary images: ${error.message}`);
  }
  
  return images;
}

async function main() {
  const images = await getAllCloudinaryImages();
  
  // Save to JSON
  const outputPath = path.resolve(__dirname, '../all-cloudinary-images-complete.json');
  const outputData = {
    generatedAt: new Date().toISOString(),
    total: images.length,
    images: images.map(img => ({
      name: img.name,
      url: img.url,
      size: img.size,
      format: img.format,
      folder: img.folder,
      uploadedAt: img.uploadedAt?.toISOString(),
    })),
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`💾 Complete image list saved to: ${outputPath}`);
  console.log(`📊 Total images: ${images.length}`);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
