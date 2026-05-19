import { z } from 'zod';

export const listMovementsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('50'),
    branchId: z.string().optional(),
    productId: z.string().optional(),
    movementType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const reportsSchema = z.object({
  query: z.object({
    type: z.enum(['valuation', 'purchase', 'transfer', 'stockout', 'lowstock', 'aging', 'movement_summary', 'financial_audit']),
    branchId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    supplierId: z.string().optional(),
    productId: z.string().optional(),
    categoryId: z.string().optional(),
  }),
});
