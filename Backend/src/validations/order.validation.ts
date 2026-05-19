import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

const createOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItemSchema).min(1, 'At least one item is required'),
    paymentMethod: z.enum(['CASH', 'CARD', 'MOBILE_MONEY']).optional(),
  }),
});

const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']),
  }),
});

export { createOrderSchema, updateOrderStatusSchema };
