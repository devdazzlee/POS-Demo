import { z } from 'zod';

const taxBaseSchema = {
    name: z.string().min(1, 'Name is required').max(100),
    percentage: z.number().min(0, 'Percentage must be at least 0').max(100, 'Percentage cannot exceed 100'),
    is_active: z.boolean().optional().default(true),
};

export const createtaxeschema = z.object({
    body: z.object(taxBaseSchema),
});

export const updatetaxeschema = z.object({
    body: z.object({
        ...taxBaseSchema,
        name: taxBaseSchema.name.optional(),
        percentage: taxBaseSchema.percentage.optional(),
    }),
    params: z.object({
        id: z.string().min(1, 'Tax ID is required'),
    }),
});

export const gettaxeschema = z.object({
    params: z.object({
        id: z.string().min(1, 'Tax ID is required'),
    }),
});

export const listTaxesSchema = z.object({
    query: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('10'),
        search: z.string().optional(),
        is_active: z.string().optional(),
    }),
});

export type CreateTaxInput = z.infer<typeof createtaxeschema>['body'];
export type UpdateTaxInput = z.infer<typeof updatetaxeschema>['body'];