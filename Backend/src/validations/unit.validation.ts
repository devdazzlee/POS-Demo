import { z } from 'zod';

const unitBaseSchema = {
    name: z.string().min(1, 'Name is required').max(100),
    is_active: z.boolean().optional().default(true),
    display_on_pos: z.boolean().optional().default(true),
};

export const createUnitSchema = z.object({
    body: z.object(unitBaseSchema),
});

export const updateUnitSchema = z.object({
    body: z.object({
        ...unitBaseSchema,
        name: unitBaseSchema.name.optional(),
    }),
    params: z.object({
        id: z.string().min(1, 'Unit ID is required'),
    }),
});

export const getUnitSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Unit ID is required'),
    }),
});

export const listUnitsSchema = z.object({
    query: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('10'),
        search: z.string().optional(),
    }),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>['body'];
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>['body'];