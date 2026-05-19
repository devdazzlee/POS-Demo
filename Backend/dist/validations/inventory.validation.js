"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsSchema = exports.listMovementsSchema = void 0;
const zod_1 = require("zod");
exports.listMovementsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().default('1'),
        limit: zod_1.z.string().optional().default('50'),
        branchId: zod_1.z.string().optional(),
        productId: zod_1.z.string().optional(),
        movementType: zod_1.z.string().optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }),
});
exports.reportsSchema = zod_1.z.object({
    query: zod_1.z.object({
        type: zod_1.z.enum(['valuation', 'purchase', 'transfer', 'stockout', 'lowstock', 'aging', 'movement_summary', 'financial_audit']),
        branchId: zod_1.z.string().optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        supplierId: zod_1.z.string().optional(),
        productId: zod_1.z.string().optional(),
        categoryId: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=inventory.validation.js.map