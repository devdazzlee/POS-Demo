import { Router } from 'express';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getDashboardStats,
  getLowStockProducts,
  getStockMovements,
  getStockByLocation,
  getReports,
} from '../controllers/inventory.controller';
import {
  listMovementsSchema,
  reportsSchema,
} from '../validations/inventory.validation';

const router = Router();

const allInventoryRoles = [
  'SUPER_ADMIN',
  'ADMIN',
  'PURCHASE_MANAGER',
  'WAREHOUSE_MANAGER',
  'BRANCH_MANAGER',
];

router.use(authenticate, authorize(allInventoryRoles));

router.get('/dashboard', getDashboardStats);
router.get('/low-stock', getLowStockProducts);
router.get('/movements', validate(listMovementsSchema), getStockMovements);
router.get('/stock-by-location', getStockByLocation);
router.get('/reports', validate(reportsSchema), getReports);

export default router;
