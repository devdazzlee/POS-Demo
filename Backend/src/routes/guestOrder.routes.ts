import { Router } from 'express';
import { createGuestOrder, getGuestOrders, getGuestOrderById } from '../controllers/guestOrder.controller';
import { validate } from '../middleware/validation.middleware';
import { createGuestOrderSchema } from '../validations/guestOrder.validation';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public route - no authentication required for guest checkout
router.post('/', validate(createGuestOrderSchema), createGuestOrder);

// Protected routes - require authentication for admin/branch to view orders
router.get('/', authenticate, getGuestOrders);
router.get('/:id', authenticate, getGuestOrderById);

export default router;

