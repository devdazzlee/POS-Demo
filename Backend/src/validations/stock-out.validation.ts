import { z } from 'zod';

export const logStockOutSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product is required'),
    branchId: z.string().min(1, 'Branch is required'),
    quantity: z.number().positive('Quantity must be positive'),
    reason: z.enum(['SALE', 'DAMAGE', 'LOSS', 'RETURN', 'EXPIRED']),
    notes: z.string().optional(),
  }),
});

export const logBulkStockOutSchema = z.object({
  body: z.object({
    branchId: z.string().min(1, 'Branch is required'),
    reason: z.enum(['SALE', 'DAMAGE', 'LOSS', 'RETURN', 'EXPIRED']),
    customerId: z.string().optional(),
    documentRef: z.string().optional(),
    dispatchDate: z.string().optional(),
    notes: z.string().optional(),
    lines: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product is required'),
          quantity: z.number().positive('Quantity must be positive'),
          rate: z.number().nonnegative().optional(),
        }),
      )
      .min(1, 'At least one line is required'),
  }),
});

export const listStockOutSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    reason: z.enum(['SALE', 'DAMAGE', 'LOSS', 'RETURN', 'EXPIRED']).optional(),
    branchId: z.string().optional(),
    productId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const logReturnSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product is required'),
    branchId: z.string().min(1, 'Branch is required'),
    quantity: z.number().positive('Quantity must be positive'),
    notes: z.string().optional(),
  }),
});
