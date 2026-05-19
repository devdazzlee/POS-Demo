import { S3Client, ListObjectsV2Command, ListObjectsCommand } from '@aws-sdk/client-s3';
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
  uploadedAt?: Date;
}

async function listS3Images(): Promise<ImageInfo[]> {
  console.log('🚀 Starting AWS S3 image listing...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const images: ImageInfo[] = [];
  
  // Check environment variables
  const bucketName = process.env.BUCKET_NAME;
  const region = process.env.AWS_REGION || 'eu-north-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  
  console.log('📋 Configuration:');
  console.log(`   Bucket: ${bucketName || 'NOT SET'}`);
  console.log(`   Region: ${region}`);
  console.log(`   Access Key ID: ${accessKeyId ? accessKeyId.substring(0, 8) + '...' : 'NOT SET'}`);
  console.log(`   Secret Key: ${secretAccessKey ? '***SET***' : 'NOT SET'}\n`);
  
  if (!bucketName) {
    console.error('❌ BUCKET_NAME not set in environment variables');
    console.log('   Please set BUCKET_NAME in your .env file');
    return images;
  }
  
  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ AWS credentials not set in environment variables');
    console.log('   Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file');
    return images;
  }
  
  // Create S3 client
  const s3 = new S3Client({
    region: region,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  });
  
  try {
    console.log('📦 Attempting to list objects from S3 bucket...\n');
    
    let continuationToken: string | undefined = undefined;
    let hasMore = true;
    let pageCount = 0;
    
    while (hasMore) {
      pageCount++;
      console.log(`   Fetching page ${pageCount}...`);
      
      try {
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        });
        
        const response: any = await s3.send(command);
        
        if (response.Contents && response.Contents.length > 0) {
          console.log(`   ✓ Found ${response.Contents.length} objects in this page`);
          
          for (const object of response.Contents) {
            if (object.Key) {
              // Determine URL format based on region
              let url: string;
              if (region.includes('us-east-1')) {
                url = `https://${bucketName}.s3.amazonaws.com/${object.Key}`;
              } else {
                url = `https://${bucketName}.s3.${region}.amazonaws.com/${object.Key}`;
              }
              
              // Check if it's an image file
              const ext = object.Key.split('.').pop()?.toLowerCase();
              const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
              
              if (ext && imageExtensions.includes(ext)) {
                images.push({
                  name: object.Key,
                  url: url,
                  size: object.Size,
                  format: ext,
                  folder: object.Key.includes('/') 
                    ? object.Key.substring(0, object.Key.lastIndexOf('/')) 
                    : 'root',
                  uploadedAt: object.LastModified,
                });
              }
            }
          }
        } else {
          console.log(`   ⚠️  No objects found in this page`);
        }
        
        continuationToken = response.NextContinuationToken;
        hasMore = !!continuationToken && (response.Contents?.length || 0) > 0;
        
        // Small delay to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (pageError: any) {
        console.error(`   ❌ Error on page ${pageCount}: ${pageError.message}`);
        
        // Try alternative method (ListObjects instead of ListObjectsV2)
        if (pageCount === 1) {
          console.log('   Trying alternative method (ListObjects)...');
          try {
            const altCommand = new ListObjectsCommand({
              Bucket: bucketName,
              MaxKeys: 1000,
            });
            
            const altResponse: any = await s3.send(altCommand);
            
            if (altResponse.Contents && altResponse.Contents.length > 0) {
              console.log(`   ✓ Found ${altResponse.Contents.length} objects using alternative method`);
              
              for (const object of altResponse.Contents) {
                if (object.Key) {
                  const ext = object.Key.split('.').pop()?.toLowerCase();
                  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
                  
                  if (ext && imageExtensions.includes(ext)) {
                    let url: string;
                    if (region.includes('us-east-1')) {
                      url = `https://${bucketName}.s3.amazonaws.com/${object.Key}`;
                    } else {
                      url = `https://${bucketName}.s3.${region}.amazonaws.com/${object.Key}`;
                    }
                    
                    images.push({
                      name: object.Key,
                      url: url,
                      size: object.Size,
                      format: ext,
                      folder: object.Key.includes('/') 
                        ? object.Key.substring(0, object.Key.lastIndexOf('/')) 
                        : 'root',
                      uploadedAt: object.LastModified,
                    });
                  }
                }
              }
            }
          } catch (altError: any) {
            console.error(`   ❌ Alternative method also failed: ${altError.message}`);
          }
        }
        
        break; // Exit loop on error
      }
    }
    
    console.log(`\n✅ Successfully fetched ${images.length} images from S3\n`);
  } catch (error: any) {
    console.error(`\n❌ Error fetching S3 images: ${error.message}\n`);
    
    if (error.name === 'AccessDenied') {
      console.log('⚠️  Access Denied Error:');
      console.log('   The AWS credentials do not have permission to list objects in this bucket.');
      console.log('   Required IAM permission: s3:ListBucket');
      console.log('   Please check your IAM policy and ensure it includes:');
      console.log('   {');
      console.log('     "Effect": "Allow",');
      console.log('     "Action": ["s3:ListBucket"],');
      console.log(`     "Resource": "arn:aws:s3:::${bucketName}"`);
      console.log('   }');
    } else if (error.name === 'InvalidAccessKeyId') {
      console.log('⚠️  Invalid Access Key ID');
      console.log('   Please check your AWS_ACCESS_KEY_ID in .env file');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.log('⚠️  Invalid Secret Access Key');
      console.log('   Please check your AWS_SECRET_ACCESS_KEY in .env file');
    } else if (error.message?.includes('credentials')) {
      console.log('⚠️  Credentials Error');
      console.log('   Make sure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set correctly');
    } else if (error.message?.includes('bucket')) {
      console.log('⚠️  Bucket Error');
      console.log(`   Please verify that bucket "${bucketName}" exists in region "${region}"`);
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
  const images = await listS3Images();
  
  if (images.length === 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   📦 AWS S3: 0 images found');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return;
  }
  
  // Group by folder
  const byFolder: { [key: string]: ImageInfo[] } = {};
  images.forEach(img => {
    const folder = img.folder || 'root';
    if (!byFolder[folder]) {
      byFolder[folder] = [];
    }
    byFolder[folder].push(img);
  });
  
  // Display summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   📦 AWS S3: ${images.length} images found`);
  console.log(`   📁 Folders: ${Object.keys(byFolder).length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Display images by folder
  console.log('📦 AWS S3 IMAGES BY FOLDER:\n');
  Object.keys(byFolder).sort().forEach(folder => {
    const folderImages = byFolder[folder];
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
  
  // Save to JSON file
  const outputPath = path.resolve(__dirname, '../aws-s3-images-list.json');
  const outputData = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: images.length,
      folders: Object.keys(byFolder).length,
    },
    byFolder: byFolder,
    all: images.map(img => ({
      name: img.name,
      url: img.url,
      size: img.size,
      format: img.format,
      folder: img.folder,
      uploadedAt: img.uploadedAt?.toISOString(),
    })),
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`💾 Full list saved to: ${outputPath}`);
  
  // Create a simple text file
  const textOutputPath = path.resolve(__dirname, '../aws-s3-images-list.txt');
  let textContent = `AWS S3 Images List - Generated: ${new Date().toISOString()}\n`;
  textContent += '='.repeat(80) + '\n\n';
  
  images.forEach((img, index) => {
    textContent += `${index + 1}. ${img.name}\n`;
    textContent += `   URL: ${img.url}\n`;
    textContent += `   Size: ${formatBytes(img.size)}, Format: ${img.format || 'unknown'}, Folder: ${img.folder || 'root'}\n\n`;
  });
  
  fs.writeFileSync(textOutputPath, textContent);
  console.log(`📄 Simple text list saved to: ${textOutputPath}`);
  
  console.log('\n✅ AWS S3 image listing completed!');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
