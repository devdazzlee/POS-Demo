import * as fs from 'fs';
import * as path from 'path';

async function fixImageExtensions() {
  console.log('🔧 Fixing image file extensions...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const downloadDir = path.resolve(__dirname, '../downloaded-images');
  const febDir = path.join(downloadDir, 'february-2026');
  const marDir = path.join(downloadDir, 'march-2026');
  
  let fixed = 0;
  let failed = 0;
  
  // Fix February images
  console.log('📁 Fixing February 2026 images...\n');
  if (fs.existsSync(febDir)) {
    const files = fs.readdirSync(febDir);
    
    for (const file of files) {
      const oldPath = path.join(febDir, file);
      
      // Check if file needs fixing (no dot before extension)
      if (!file.includes('.') || file.endsWith('jpg') || file.endsWith('png') || file.endsWith('jpeg') || file.endsWith('webp') || file.endsWith('gif')) {
        let newFileName = file;
        
        // Add dot before extension
        if (file.endsWith('jpg')) {
          newFileName = file.replace(/jpg$/, '.jpg');
        } else if (file.endsWith('jpeg')) {
          newFileName = file.replace(/jpeg$/, '.jpeg');
        } else if (file.endsWith('png')) {
          newFileName = file.replace(/png$/, '.png');
        } else if (file.endsWith('webp')) {
          newFileName = file.replace(/webp$/, '.webp');
        } else if (file.endsWith('gif')) {
          newFileName = file.replace(/gif$/, '.gif');
        }
        
        if (newFileName !== file) {
          const newPath = path.join(febDir, newFileName);
          try {
            fs.renameSync(oldPath, newPath);
            fixed++;
            if (fixed % 20 === 0) {
              console.log(`   Fixed ${fixed} files...`);
            }
          } catch (error) {
            failed++;
            console.error(`   ❌ Failed to rename ${file}: ${(error as Error).message}`);
          }
        }
      }
    }
  }
  
  console.log(`\n✅ February: ${fixed} files fixed, ${failed} failed\n`);
  
  // Fix March images
  console.log('📁 Fixing March 2026 images...\n');
  fixed = 0;
  failed = 0;
  
  if (fs.existsSync(marDir)) {
    const files = fs.readdirSync(marDir);
    
    for (const file of files) {
      const oldPath = path.join(marDir, file);
      
      // Check if file needs fixing (no dot before extension)
      if (!file.includes('.') || file.endsWith('jpg') || file.endsWith('png') || file.endsWith('jpeg') || file.endsWith('webp') || file.endsWith('gif')) {
        let newFileName = file;
        
        // Add dot before extension
        if (file.endsWith('jpg')) {
          newFileName = file.replace(/jpg$/, '.jpg');
        } else if (file.endsWith('jpeg')) {
          newFileName = file.replace(/jpeg$/, '.jpeg');
        } else if (file.endsWith('png')) {
          newFileName = file.replace(/png$/, '.png');
        } else if (file.endsWith('webp')) {
          newFileName = file.replace(/webp$/, '.webp');
        } else if (file.endsWith('gif')) {
          newFileName = file.replace(/gif$/, '.gif');
        }
        
        if (newFileName !== file) {
          const newPath = path.join(marDir, newFileName);
          try {
            fs.renameSync(oldPath, newPath);
            fixed++;
            if (fixed % 20 === 0) {
              console.log(`   Fixed ${fixed} files...`);
            }
          } catch (error) {
            failed++;
            console.error(`   ❌ Failed to rename ${file}: ${(error as Error).message}`);
          }
        }
      }
    }
  }
  
  console.log(`\n✅ March: ${fixed} files fixed, ${failed} failed\n`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ File extensions fixed!');
  console.log('   You should now be able to open the image files.\n');
}

fixImageExtensions().catch(console.error);
