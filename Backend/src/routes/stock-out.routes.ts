import { Router } from 'express';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { logStockOut, logBulkStockOut, listStockOut, logReturn } from '../controllers/stock-out.controller';
import {
  logStockOutSchema,
  logBulkStockOutSchema,
  listStockOutSchema,
  logReturnSchema,
} from '../validations/stock-out.validation';

const router = Router();

router.use(
  authenticate,
  authorize(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'])
);

router.get('/', validate(listStockOutSchema), listStockOut);
router.post('/out', validate(logStockOutSchema), logStockOut);
router.post('/bulk', validate(logBulkStockOutSchema), logBulkStockOut);
router.post('/return', validate(logReturnSchema), logReturn);

export default router;
