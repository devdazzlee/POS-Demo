import { z } from 'zod';

export const createSalarySchema = z.object({
  body: z.object({
    employee_id: z.string().uuid(),
    month: z.number().min(1).max(12),
    year: z.number().min(2020),
    amount: z.number(),
    is_paid: z.boolean().optional(),
    paid_date: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

export const listSalariesSchema = z.object({
  query: z.object({
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
  }),
});

export const salaryIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type CreateSalaryInput = z.infer<typeof createSalarySchema>['body'];
