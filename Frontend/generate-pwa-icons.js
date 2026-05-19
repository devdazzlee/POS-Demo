const fs = require('fs');
const path = require('path');

// Simple icon generation using canvas (if sharp is not available, we'll just copy the logo)
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  const logoPath = path.join(__dirname, 'public', 'logo.png');
  const iconsDir = path.join(__dirname, 'public', 'icons');

  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('Generating PWA icons...');

  try {
    // Try to use sharp for proper resizing
    const sharp = require('sharp');
    
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toFile(outputPath);
      console.log(`✓ Created ${size}x${size} icon`);
    }
    
    console.log('\n✓ All PWA icons generated successfully!');
  } catch (error) {
    console.log('Sharp not available, installing...');
    console.log('Please run: yarn add sharp --dev');
    console.log('Then run: node generate-pwa-icons.js');
  }
}

generateIcons().catch(console.error);

