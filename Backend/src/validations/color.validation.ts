import { z } from 'zod';

const colorBaseSchema = {
    name: z.string().min(1, 'Name is required').max(100),
    is_active: z.boolean().optional(),
};

export const createColorSchema = z.object({
    body: z.object(colorBaseSchema),
});

export const updateColorSchema = z.object({
    body: z.object({
        ...colorBaseSchema,
        name: colorBaseSchema.name.optional(),
    }),
    params: z.object({
        id: z.string().min(1, 'Color ID is required'),
    }),
});

export const getColorSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Color ID is required'),
    }),
});

export const listColorsSchema = z.object({
    query: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('10'),
        search: z.string().optional(),
    }),
});

export type CreateColorInput = z.infer<typeof createColorSchema>['body'];
export type UpdateColorInput = z.infer<typeof updateColorSchema>['body'];