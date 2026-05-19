import { z } from 'zod';

export const createAdjustmentSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product is required'),
    branchId: z.string().min(1, 'Branch is required'),
    systemQuantity: z.number(),
    adjustmentType: z.enum(['ADDITION', 'SUBTRACTION', 'RECONCILIATION']),
    adjustmentCategory: z.enum(['CORRECTION', 'DAMAGE', 'EXPIRED', 'THEFT', 'RETURN_TO_SUPPLIER', 'ADMINISTRATIVE']),
    physicalCount: z.number().optional(),
    changeQuantity: z.number().optional(),
    reason: z.string().optional(),
    referenceNo: z.string().optional(),
  }),
});

export const listAdjustmentsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
    productId: z.string().optional(),
    branchId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});
