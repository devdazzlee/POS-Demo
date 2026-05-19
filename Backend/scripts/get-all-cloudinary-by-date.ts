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

async function getAllImagesByDateRange() {
  console.log('🚀 Fetching ALL Cloudinary images with date filtering...\n');
  
  const allImages: ImageInfo[] = [];
  const seenUrls = new Set<string>();
  
  // Get all images without date restriction first
  console.log('📸 Fetching all images...');
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
            allImages.push({
              name: resource.public_id,
              url: resource.secure_url,
              size: resource.bytes,
              format: resource.format,
              folder: resource.folder || 'root',
              uploadedAt: new Date(resource.created_at),
            });
          }
        }
        console.log(`   Page ${pageCount}: ${result.resources.length} images (total: ${allImages.length})`);
      }
      
      nextCursor = result.next_cursor;
      hasMore = !!nextCursor;
      
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error: any) {
      console.error(`   Error on page ${pageCount}: ${error.message}`);
      hasMore = false;
    }
  }
  
  console.log(`\n✅ Total images fetched: ${allImages.length}\n`);
  
  // Analyze by date
  const byYearMonth: { [key: string]: ImageInfo[] } = {};
  allImages.forEach(img => {
    if (img.uploadedAt) {
      const key = img.uploadedAt.toISOString().substring(0, 7); // YYYY-MM
      if (!byYearMonth[key]) {
        byYearMonth[key] = [];
      }
      byYearMonth[key].push(img);
    }
  });
  
  console.log('📅 Images by Year-Month:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Object.keys(byYearMonth).sort().forEach(month => {
    const count = byYearMonth[month].length;
    const recent = month >= '2026-02';
    const marker = recent ? '🆕' : '  ';
    console.log(`${marker} ${month}: ${count} images`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Show February 2026 images in detail
  const feb2026 = allImages.filter(img => {
    if (!img.uploadedAt) return false;
    const d = img.uploadedAt;
    return d >= new Date('2026-02-01') && d < new Date('2026-03-01');
  });
  
  console.log(`📸 February 2026 Images (${feb2026.length}):\n`);
  feb2026.sort((a, b) => {
    const dateA = a.uploadedAt?.getTime() || 0;
    const dateB = b.uploadedAt?.getTime() || 0;
    return dateB - dateA; // Most recent first
  });
  
  feb2026.forEach((img, i) => {
    const dateStr = img.uploadedAt?.toISOString().substring(0, 19).replace('T', ' ') || 'Unknown';
    console.log(`${i + 1}. [${dateStr}] ${img.name}`);
    console.log(`   ${img.url}`);
    console.log(`   Size: ${(img.size || 0) / 1024} KB, Format: ${img.format}, Folder: ${img.folder || 'root'}\n`);
  });
  
  // Save complete list
  const outputPath = path.resolve(__dirname, '../all-cloudinary-images-complete.json');
  const outputData = {
    generatedAt: new Date().toISOString(),
    total: allImages.length,
    byMonth: Object.keys(byYearMonth).reduce((acc, month) => {
      acc[month] = byYearMonth[month].length;
      return acc;
    }, {} as { [key: string]: number }),
    february2026: {
      count: feb2026.length,
      images: feb2026.map(img => ({
        name: img.name,
        url: img.url,
        size: img.size,
        format: img.format,
        folder: img.folder,
        uploadedAt: img.uploadedAt?.toISOString(),
      })),
    },
    all: allImages.map(img => ({
      name: img.name,
      url: img.url,
      size: img.size,
      format: img.format,
      folder: img.folder,
      uploadedAt: img.uploadedAt?.toISOString(),
    })),
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`💾 Complete list saved to: ${outputPath}`);
  console.log(`📊 Total images: ${allImages.length}`);
  console.log(`📅 February 2026: ${feb2026.length} images`);
}

getAllImagesByDateRange().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
