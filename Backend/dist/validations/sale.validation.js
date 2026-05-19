"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundSaleSchema = exports.createSaleSchema = void 0;
const zod_1 = require("zod");
const saleItemSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    quantity: zod_1.z.number().positive("Quantity must be positive"),
    price: zod_1.z.number().nonnegative(),
});
const createSaleSchema = zod_1.z.object({
    body: zod_1.z.object({
        customerId: zod_1.z.string().optional(),
        paymentMethod: zod_1.z.enum(["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER", "CREDIT"]),
        items: zod_1.z.array(saleItemSchema).min(1),
        discountAmount: zod_1.z.number().nonnegative("Discount amount must be non-negative").optional().default(0),
    }),
});
exports.createSaleSchema = createSaleSchema;
const refundSaleSchema = zod_1.z.object({
    body: zod_1.z.object({
        customerId: zod_1.z.string().optional(),
        returnedItems: zod_1.z
            .array(zod_1.z.object({
            productId: zod_1.z.string().min(1, "Product ID is required"),
            quantity: zod_1.z.number().positive("Quantity must be positive"),
        }))
            .optional()
            .default([]),
        exchangedItems: zod_1.z
            .array(zod_1.z.object({
            productId: zod_1.z.string().min(1, "Product ID is required"),
            quantity: zod_1.z.number().positive("Quantity must be positive"),
            price: zod_1.z.number().nonnegative("Price must be non-negative"),
        }))
            .optional()
            .default([]),
        notes: zod_1.z.string().optional(),
    }).refine((data) => {
        // Ensure at least one item is being returned or exchanged
        return data.returnedItems.length > 0 || data.exchangedItems.length > 0;
    }, {
        message: "At least one item must be returned or exchanged",
        path: ["returnedItems"], // This will show the error on the returnedItems field
    }),
});
exports.refundSaleSchema = refundSaleSchema;
//# sourceMappingURL=sale.validation.js.map