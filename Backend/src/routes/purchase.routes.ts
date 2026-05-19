import { Router } from 'express';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  createPurchase,
  createBulkPurchase,
  listPurchases,
  getPurchaseById,
  getMonthlyStats,
} from '../controllers/purchase.controller';
import {
  createPurchaseSchema,
  createBulkPurchaseSchema,
  listPurchasesSchema,
} from '../validations/purchase.validation';

const router = Router();

router.use(
  authenticate,
  authorize(['SUPER_ADMIN', 'ADMIN', 'PURCHASE_MANAGER', 'WAREHOUSE_MANAGER', 'BRANCH_MANAGER'])
);

router.post('/', validate(createPurchaseSchema), createPurchase);
router.post('/bulk', validate(createBulkPurchaseSchema), createBulkPurchase);
router.get('/', validate(listPurchasesSchema), listPurchases);
router.get('/stats', getMonthlyStats);
router.get('/:id', getPurchaseById);

export default router;
