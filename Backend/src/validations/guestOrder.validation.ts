import { z } from 'zod';

const orderItemSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    productId: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1, 'Product name is required'),
    price: z.number().min(0, 'Price must be positive'),
    quantity: z.coerce.number().positive('Quantity must be greater than zero'),
    gramsPerUnit: z.coerce.number().positive().optional(),
    unitName: z.string().trim().optional(),
    image: z.string().optional(),
  })
  .refine((val) => Boolean(val.id || val.productId), {
    message: 'Product ID is required',
    path: ['productId'],
  });

const createGuestOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItemSchema).min(1, 'At least one item is required'),
    customer: z.object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      email: z.string().email('Invalid email address'),
      phone: z.string().min(1, 'Phone number is required'),
    }),
    shipping: z.object({
      address: z.string().min(1, 'Address is required'),
      city: z.string().min(1, 'City is required'),
      postalCode: z.string().optional(),
    }),
    paymentMethod: z.enum(['cash', 'card']).default('cash'),
    subtotal: z.number().min(0),
    shippingCost: z.number().min(0),
    total: z.number().min(0),
    orderNotes: z.string().optional(),
  }),
});

export { createGuestOrderSchema };

