import { z } from "zod";

const saleItemSchema = z.object({
    productId: z.string(),
    quantity: z.number().positive("Quantity must be positive"),
    price: z.number().nonnegative(),
});

const createSaleSchema = z.object({
    body: z.object({
        customerId: z.string().optional(),
        paymentMethod: z.enum(["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER", "CREDIT"]),
        items: z.array(saleItemSchema).min(1),
        discountAmount: z.number().nonnegative("Discount amount must be non-negative").optional().default(0),
    }),
});

const refundSaleSchema = z.object({
    body: z.object({
        customerId: z.string().optional(),
        returnedItems: z
            .array(
                z.object({
                    productId: z.string().min(1, "Product ID is required"),
                    quantity: z.number().positive("Quantity must be positive"),
                })
            )
            .optional()
            .default([]),
        exchangedItems: z
            .array(
                z.object({
                    productId: z.string().min(1, "Product ID is required"),
                    quantity: z.number().positive("Quantity must be positive"),
                    price: z.number().nonnegative("Price must be non-negative"),
                })
            )
            .optional()
            .default([]),
        notes: z.string().optional(),
    }).refine((data) => {
        // Ensure at least one item is being returned or exchanged
        return data.returnedItems.length > 0 || data.exchangedItems.length > 0;
    }, {
        message: "At least one item must be returned or exchanged",
        path: ["returnedItems"], // This will show the error on the returnedItems field
    }),
});

export { createSaleSchema, refundSaleSchema };