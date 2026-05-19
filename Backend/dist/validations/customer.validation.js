"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerUpdateSchema = exports.customerCreateByAdminSchema = exports.customerLoginSchema = exports.cusRegisterationSchema = void 0;
const zod_1 = require("zod");
// Customer self-registration — only email is required (the password is
// generated / sent separately in the existing flow).
const cusRegisterationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
    }),
});
exports.cusRegisterationSchema = cusRegisterationSchema;
const customerLoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
    }),
});
exports.customerLoginSchema = customerLoginSchema;
// Admin / staff creating a customer from the POS Customers screen. Email is
// required and the other contact fields are optional but format-checked
// when present. Phone allows digits / +/- /space — the frontend mirrors
// these rules so the user gets instant feedback.
const customerCreateByAdminSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        name: zod_1.z.string().trim().min(1, 'Name is required').optional(),
        phone_number: zod_1.z
            .string()
            .trim()
            .min(7, 'Phone number must be at least 7 digits')
            .max(20, 'Phone number is too long')
            .regex(/^[0-9+\-\s]+$/, 'Phone number must contain only digits, +, -, or spaces')
            .optional(),
        address: zod_1.z.string().trim().min(1, 'Address is required').optional(),
        billing_address: zod_1.z.string().trim().min(1, 'Billing address is required').optional(),
        is_active: zod_1.z.boolean().optional(),
    }),
});
exports.customerCreateByAdminSchema = customerCreateByAdminSchema;
const customerUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        // Email can be edited; if present must be valid. Nullable so a
        // future "clear email" action is supported without another schema.
        email: zod_1.z.string().email('Invalid email address').nullable().optional(),
        name: zod_1.z.string().trim().min(1, 'Name is required').nullable().optional(),
        phone_number: zod_1.z
            .string()
            .trim()
            .min(7, 'Phone number must be at least 7 digits')
            .max(20, 'Phone number is too long')
            .regex(/^[0-9+\-\s]+$/, 'Phone number must contain only digits, +, -, or spaces')
            .nullable()
            .optional(),
        address: zod_1.z.string().trim().min(1, 'Address is required').nullable().optional(),
        billing_address: zod_1.z
            .string()
            .trim()
            .min(1, 'Billing address is required')
            .nullable()
            .optional(),
        is_active: zod_1.z.boolean().optional(),
    }),
});
exports.customerUpdateSchema = customerUpdateSchema;
//# sourceMappingURL=customer.validation.js.map