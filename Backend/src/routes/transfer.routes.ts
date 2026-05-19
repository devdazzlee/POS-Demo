import { Router } from 'express';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  createTransfer,
  updateTransferStatus,
  listTransfers,
  getTransferById,
  getPendingTransfers,
} from '../controllers/transfer.controller';
import {
  createTransferSchema,
  updateTransferStatusSchema,
  listTransfersSchema,
} from '../validations/transfer.validation';

const router = Router();

router.use(
  authenticate,
  authorize(['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER', 'BRANCH_MANAGER'])
);

router.post('/', validate(createTransferSchema), createTransfer);
router.patch('/:id/status', validate(updateTransferStatusSchema), updateTransferStatus);
router.get('/pending', getPendingTransfers);
router.get('/', validate(listTransfersSchema), listTransfers);
router.get('/:id', getTransferById);

export default router;
