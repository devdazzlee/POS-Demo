import { Router } from 'express';
import {
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrderByAdmin,
  reopenOrder,
  deleteOrder
} from '../controllers/order.controller';
import { validate } from '../middleware/validation.middleware';
import { updateOrderStatusSchema } from '../validations/order.validation';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// 🛡 ADMIN ROUTES
router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN', 'PURCHASE_MANAGER', 'WAREHOUSE_MANAGER', 'BRANCH_MANAGER']));

router.get('/', getOrders);
router.get('/:orderId', getOrder);
router.patch('/:orderId/status', validate(updateOrderStatusSchema), updateOrderStatus);
router.patch('/:orderId/reopen', reopenOrder);
router.delete('/:orderId', deleteOrder);

export default router;
