import { z } from 'zod';

export const createExpenseSchema = z.object({
    body: z.object({
        particular: z.string().min(1),
        amount: z.number().positive(),
    }),
});

export const listExpensesSchema = z.object({
    query: z.object({
        page: z.coerce.number().optional(),
        limit: z.coerce.number().optional(),
    }),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>['body'];
