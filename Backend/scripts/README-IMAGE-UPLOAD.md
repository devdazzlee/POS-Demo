# Image Upload to Cloudinary Script

This script uploads product images from the WordPress download folder to Cloudinary and matches them to products in the backend database.

## Prerequisites

1. Cloudinary account configured (already set up)
2. Product images downloaded in `Wordpress images/product_images/` folder
3. Database connection configured

## Usage

Run the script using yarn:

```bash
yarn upload:images
```

Or directly with ts-node:

```bash
ts-node scripts/upload-images-to-cloudinary.ts
```

## How It Works

1. **Loads Products**: Reads product data from `Wordpress images/product_images/products_list.json`
2. **Fetches Database Products**: Gets all active products from the database
3. **Intelligent Matching**: Uses fuzzy string matching (Levenshtein distance) to match image filenames to product names
4. **Uploads to Cloudinary**: Uploads images to Cloudinary with proper naming
5. **Updates Database**: Creates `ProductImage` records and updates `Product.has_images` flag

## Matching Algorithm

The script uses intelligent matching to handle slight differences in product names:
- Removes special characters and normalizes strings
- Calculates similarity score (0-1)
- Only matches products with similarity score ≥ 0.5
- Handles variations like "Honey Land Choco Cookie" vs "Honey Land Choco Cookie"

## Output

The script provides:
- ✅ Uploaded count
- ✅ Matched count  
- ⏭️ Skipped count (already uploaded or low match score)
- ❌ Failed count
- ⚠️ Unmatched products list

## Cloudinary Configuration

- Cloud Name: `djadwzfwg`
- Folder: `manpasand/products`
- Public ID Format: `manpasand/products/{product_name}`

## Notes

- Images are uploaded with `overwrite: false` to prevent accidental overwrites
- Rate limiting: 100ms delay between uploads
- Only processes active products (`is_active: true`)
- Skips products that already have Cloudinary images

