import { z } from 'zod';

const brandBaseSchema = {
    name: z.string().min(1, 'Name is required').max(100),
    is_active: z.boolean().optional().default(true),
    display_on_pos: z.boolean().optional().default(true),
};

export const createBrandSchema = z.object({
    body: z.object(brandBaseSchema),
});

export const updateBrandSchema = z.object({
    body: z.object({
        ...brandBaseSchema,
        name: brandBaseSchema.name.optional(),
    }),
    params: z.object({
        id: z.string().min(1, 'Brand ID is required'),
    }),
});

export const getBrandSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Brand ID is required'),
    }),
});

export const listBrandsSchema = z.object({
    query: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('10'),
        search: z.string().optional(),
    }),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>['body'];
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>['body'];