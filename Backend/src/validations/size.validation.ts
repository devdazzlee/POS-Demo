import { z } from 'zod';

const sizeBaseSchema = {
    name: z.string().min(1, 'Name is required').max(100),
    is_active: z.boolean().optional(),
    display_on_pos: z.boolean().optional(),
};

export const createSizeSchema = z.object({
    body: z.object(sizeBaseSchema),
});

export const updateSizeSchema = z.object({
    body: z.object({
        ...sizeBaseSchema,
        name: sizeBaseSchema.name.optional(),
    }),
    params: z.object({
        id: z.string().min(1, 'Size ID is required'),
    }),
});

export const getSizeSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Size ID is required'),
    }),
});

export const listSizesSchema = z.object({
    query: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('10'),
        search: z.string().optional(),
    }),
});

export type CreateSizeInput = z.infer<typeof createSizeSchema>['body'];
export type UpdateSizeInput = z.infer<typeof updateSizeSchema>['body'];