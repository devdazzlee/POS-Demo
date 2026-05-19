import { z } from 'zod';

// Optional contact fields are .nullable() so the Edit form can send `null`
// explicitly to clear a previously-set value. On create the frontend omits
// empty optionals entirely, so this still leaves NULL in the column.
const optionalString = z.string().nullable().optional();
const optionalEmail = z
    .string()
    .email('Invalid email format')
    .nullable()
    .optional();

const supplierBaseSchema = {
    name: z.string().min(1, 'Name is required').max(100),
    phone_number: optionalString,
    fax_number: optionalString,
    mobile_number: optionalString,
    country: optionalString,
    city: optionalString,
    status: optionalString,
    email: optionalEmail,
    ntn: optionalString,
    strn: optionalString,
    gov_id: optionalString,
    address: optionalString,
    display_on_pos: z.boolean().optional().default(true),
};

export const createSupplierSchema = z.object({
    body: z.object(supplierBaseSchema),
});

export const updateSupplierSchema = z.object({
    body: z.object({
        ...supplierBaseSchema,
        name: z.string().min(1, 'Name is required').max(100).optional(),
    }),
    params: z.object({
        id: z.string().min(1, 'Supplier ID is required'),
    }),
});

export const getSupplierSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Supplier ID is required'),
    }),
});

export const listSuppliersSchema = z.object({
    query: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('10'),
        search: z.string().optional(),
        status: z.string().optional(),
    }),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>['body'];
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>['body'];