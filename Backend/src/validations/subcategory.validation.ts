import { z } from 'zod';

const subcategoryBaseSchema = {
  name: z.string().min(1, 'Name is required').max(100),
  display_on_pos: z.boolean().optional().default(true),
  is_active: z.boolean().optional().default(true),
};

export const createSubcategorySchema = z.object({
  body: z.object({
    ...subcategoryBaseSchema,
  }),
});

export const updateSubcategorySchema = z.object({
  body: z.object({
    ...subcategoryBaseSchema,
    name: subcategoryBaseSchema.name.optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Subcategory ID is required'),
  }),
});

export const getSubcategorySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Subcategory ID is required'),
  }),
});

export const listSubcategoriesSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    search: z.string().optional(),
    is_active: z.string().optional(),
  }),
});

export type CreateSubcategoryInput = z.infer<typeof createSubcategorySchema>['body'];
export type UpdateSubcategoryInput = z.infer<typeof updateSubcategorySchema>['body'];