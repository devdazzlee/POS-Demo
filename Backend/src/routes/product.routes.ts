import express from 'express';
import {
  createProduct,
  getProduct,
  updateProduct,
  toggleProductStatus,
  listProducts,
  exportProductsToExcel,
  getFeaturedProducts,
  getBestSellingProducts,
  bulkUploadProducts,
  deleteAllProducts,
  deleteProduct,
  uploadProductImage,
} from '../controllers/product.controller';
import {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
  listProductsSchema,
} from '../validations/product.validation';
import { validate } from '../middleware/validation.middleware';
// import { authenticate, authorize } from '../middleware/auth.middleware';
import upload from '../utils/multer';
import { parseFormData } from '../middleware/parse-formdata.middleware';
import uploadBulk from '../utils/uploadBulk';

const router = express.Router();

// router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));

router.post(
  '/',
  upload.array('images', 10),
  parseFormData,
  validate(createProductSchema),
  createProduct,
);
router.post('/upload-image', upload.single('image'), uploadProductImage);
router.post('/bulk-upload', uploadBulk.single('file'), bulkUploadProducts);
router.delete('/all', deleteAllProducts);
router.get('/', validate(listProductsSchema), listProducts);
router.get('/export/excel', exportProductsToExcel);
router.get('/featured', getFeaturedProducts);
router.get('/best-selling', getBestSellingProducts);
router.get('/:id', validate(getProductSchema), getProduct);
router.patch('/:id', validate(updateProductSchema), updateProduct);
router.patch('/:id/toggle-status', validate(getProductSchema), toggleProductStatus);
router.delete('/:id', validate(getProductSchema), deleteProduct);

export default router;
