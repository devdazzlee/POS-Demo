import { Router } from 'express';
import {
    createOrder,
    getMyOrders,
    getMyOrderById,
    cancelOrderByCustomer,
} from '../controllers/order.controller';
import { validate } from '../middleware/validation.middleware';
import { createOrderSchema } from '../validations/order.validation';
import { authenticateCustomer } from '../middleware/customerAuth.middleware';

const router = Router();

// 👤 CUSTOMER ROUTES
router.use(authenticateCustomer);

router.post('/', validate(createOrderSchema), createOrder);
router.get('/', getMyOrders);
router.get('/:id', getMyOrderById);
router.delete('/:orderId', cancelOrderByCustomer); // if customers are allowed to cancel

export default router;
