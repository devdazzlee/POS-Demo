import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createCategorySchema, updateCategorySchema } from '../validations/category.validation';
import {
  createCategory,
  getCategory,
  updateCategory,
  toggleCategoryStatus,
} from '../controllers/category.controller';

import {
  createProduct,
  getProduct,
  updateProduct,
  toggleProductStatus,
} from '../controllers/product.controller';
import { createProductSchema, updateProductSchema } from '../validations/product.validation';

const router = express.Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));

router.post('/categories', validate(createCategorySchema), createCategory);
router.get('/categories/:id', getCategory);
router.put('/categories/:id', validate(updateCategorySchema), updateCategory);
router.patch('/categories/:id/status', toggleCategoryStatus);

router.post('/products', validate(createProductSchema), createProduct);
router.get('/products/:id', getProduct);
router.put('/products/:id', validate(updateProductSchema), updateProduct);
router.patch('/products/:id/status', toggleProductStatus);

export default router;
