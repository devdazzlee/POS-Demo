# Image Storage Usage in Dashboard

## Current Implementation

### Product Images
- **Storage Provider**: **Cloudinary** ✅
- **Service Used**: `CloudinaryService` from `src/services/common/cloudinaryService.ts`
- **Upload Method**: 
  - When creating/updating products via dashboard, images are uploaded to **Cloudinary**
  - Images are stored in the `products` folder on Cloudinary
  - URL format: `https://res.cloudinary.com/djadwzfwg/image/upload/...`

### Category Images  
- **Storage Provider**: **AWS S3** ✅
- **Service Used**: `S3Service` from `src/services/common/s3BucketService.ts`
- **Upload Method**:
  - When creating/updating categories, images are uploaded to **AWS S3**
  - Images are stored in the configured S3 bucket

## Code References

### Product Image Upload Flow:
1. **Controller**: `src/controllers/product.controller.ts`
   - `uploadProductImage()` - Uses `CloudinaryService`
   - `createProduct()` - Uses `CloudinaryService` via `processProductImages()`
   - `updateProduct()` - Uses `CloudinaryService` via `updateProductImagesFromBase64()`

2. **Service**: `src/services/product.service.ts`
   - Line 7: `import { imageService } from './common/cloudinaryService';`
   - Line 496: `await imageService.uploadMultipleImages(files)` - Uploads to Cloudinary
   - Line 583: `await imageService.uploadMultipleBase64Images(base64Images)` - Uploads to Cloudinary

### Category Image Upload Flow:
1. **Service**: `src/services/category.service.ts`
   - Line 5: `import { s3Service } from './common/s3BucketService';`
   - Line 181: `await s3Service.uploadMultipleImages(files)` - Uploads to AWS S3

## Summary

**When adding/updating products in the dashboard:**
- ✅ Images are uploaded to **Cloudinary**
- ❌ Images are NOT uploaded to AWS S3

**When adding/updating categories:**
- ✅ Images are uploaded to **AWS S3**
- ❌ Images are NOT uploaded to Cloudinary

## Configuration

### Cloudinary Configuration:
- Cloud Name: `djadwzfwg` (from code, can be overridden by env)
- API Key: `199548153713428` (from code, can be overridden by env)
- API Secret: `gdhzagnXsXDYGrVyEx8qjzzYktY` (from code, can be overridden by env)
- Folder: `products` (for product images)

### AWS S3 Configuration:
- Region: `eu-north-1` (default, from env: `AWS_REGION`)
- Bucket: From env: `BUCKET_NAME` or `AWS_BUCKET_NAME`
- Access Key: From env: `AWS_ACCESS_KEY_ID`
- Secret Key: From env: `AWS_SECRET_ACCESS_KEY`
