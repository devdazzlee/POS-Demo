import { z } from 'zod';

export const createPurchaseSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product is required'),
    supplierId: z.string().min(1, 'Supplier is required'),
    warehouseBranchId: z.string().min(1, 'Warehouse branch is required'),
    quantity: z.number().positive('Quantity must be positive'),
    costPrice: z.number().min(0, 'Cost price must be >= 0'),
    salePrice: z.number().min(0, 'Sale price must be >= 0'),
    purchaseDate: z.union([z.string(), z.date()]).optional(),
    invoiceRef: z.string().optional(),
    notes: z.string().optional(),
    deliveryStatus: z.enum(['PARTIAL', 'COMPLETE']).optional(),
  }),
});

export const createBulkPurchaseSchema = z.object({
  body: z.object({
    supplierId: z.string().min(1, 'Supplier is required'),
    warehouseBranchId: z.string().min(1, 'Warehouse branch is required'),
    purchaseDate: z.union([z.string(), z.date()]).optional(),
    invoiceRef: z.string().optional(),
    notes: z.string().optional(),
    batchNo: z.string().optional(),
    expiryDate: z.union([z.string(), z.date()]).optional(),
    deliveryStatus: z.enum(['PARTIAL', 'COMPLETE']).optional(),
    lines: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product is required'),
          quantity: z.number().positive('Quantity must be positive'),
          costPrice: z.number().min(0, 'Cost price must be >= 0'),
          salePrice: z.number().min(0).optional(),
        }),
      )
      .min(1, 'At least one line is required'),
  }),
});

export const listPurchasesSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
    productId: z.string().optional(),
    supplierId: z.string().optional(),
    branchId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});
