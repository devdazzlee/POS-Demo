import { z } from "zod";

// Customer self-registration — only email is required (the password is
// generated / sent separately in the existing flow).
const cusRegisterationSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
    }),
});

const customerLoginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters long'),
    }),
});

// Admin / staff creating a customer from the POS Customers screen. Email is
// required and the other contact fields are optional but format-checked
// when present. Phone allows digits / +/- /space — the frontend mirrors
// these rules so the user gets instant feedback.
const customerCreateByAdminSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        name: z.string().trim().min(1, 'Name is required').optional(),
        phone_number: z
            .string()
            .trim()
            .min(7, 'Phone number must be at least 7 digits')
            .max(20, 'Phone number is too long')
            .regex(/^[0-9+\-\s]+$/, 'Phone number must contain only digits, +, -, or spaces')
            .optional(),
        address: z.string().trim().min(1, 'Address is required').optional(),
        billing_address: z.string().trim().min(1, 'Billing address is required').optional(),
        is_active: z.boolean().optional(),
    }),
});

const customerUpdateSchema = z.object({
    body: z.object({
        // Email can be edited; if present must be valid. Nullable so a
        // future "clear email" action is supported without another schema.
        email: z.string().email('Invalid email address').nullable().optional(),
        name: z.string().trim().min(1, 'Name is required').nullable().optional(),
        phone_number: z
            .string()
            .trim()
            .min(7, 'Phone number must be at least 7 digits')
            .max(20, 'Phone number is too long')
            .regex(/^[0-9+\-\s]+$/, 'Phone number must contain only digits, +, -, or spaces')
            .nullable()
            .optional(),
        address: z.string().trim().min(1, 'Address is required').nullable().optional(),
        billing_address: z
            .string()
            .trim()
            .min(1, 'Billing address is required')
            .nullable()
            .optional(),
        is_active: z.boolean().optional(),
    }),
});

export {
    cusRegisterationSchema,
    customerLoginSchema,
    customerCreateByAdminSchema,
    customerUpdateSchema,
}