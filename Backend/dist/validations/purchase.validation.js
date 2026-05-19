"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPurchasesSchema = exports.createBulkPurchaseSchema = exports.createPurchaseSchema = void 0;
const zod_1 = require("zod");
exports.createPurchaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        productId: zod_1.z.string().min(1, 'Product is required'),
        supplierId: zod_1.z.string().min(1, 'Supplier is required'),
        warehouseBranchId: zod_1.z.string().min(1, 'Warehouse branch is required'),
        quantity: zod_1.z.number().positive('Quantity must be positive'),
        costPrice: zod_1.z.number().min(0, 'Cost price must be >= 0'),
        salePrice: zod_1.z.number().min(0, 'Sale price must be >= 0'),
        purchaseDate: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).optional(),
        invoiceRef: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        deliveryStatus: zod_1.z.enum(['PARTIAL', 'COMPLETE']).optional(),
    }),
});
exports.createBulkPurchaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        supplierId: zod_1.z.string().min(1, 'Supplier is required'),
        warehouseBranchId: zod_1.z.string().min(1, 'Warehouse branch is required'),
        purchaseDate: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).optional(),
        invoiceRef: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        batchNo: zod_1.z.string().optional(),
        expiryDate: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).optional(),
        deliveryStatus: zod_1.z.enum(['PARTIAL', 'COMPLETE']).optional(),
        lines: zod_1.z
            .array(zod_1.z.object({
            productId: zod_1.z.string().min(1, 'Product is required'),
            quantity: zod_1.z.number().positive('Quantity must be positive'),
            costPrice: zod_1.z.number().min(0, 'Cost price must be >= 0'),
            salePrice: zod_1.z.number().min(0).optional(),
        }))
            .min(1, 'At least one line is required'),
    }),
});
exports.listPurchasesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().default('1'),
        limit: zod_1.z.string().optional().default('20'),
        productId: zod_1.z.string().optional(),
        supplierId: zod_1.z.string().optional(),
        branchId: zod_1.z.string().optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=purchase.validation.js.map