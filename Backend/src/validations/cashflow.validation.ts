import { z } from 'zod';

export const createOpeningSchema = z.object({
  body: z.object({
    opening: z.number().min(0),
    sales: z.number().min(0).default(0),
  }),
});

export const createExpenseSchema = z.object({
  body: z.object({
    particular: z.string().min(1),
    amount: z.number().positive(),
  }),
});

export const addClosingSchema = z.object({
  body: z.object({
    cashflow_id: z.string().uuid(),
    closing: z.number().min(0),
  }),
});

export const getCashFlowByDateSchema = z.object({
  query: z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
  }),
});

export const getExpensesByDateSchema = z.object({
  query: z.object({
    date: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
  }),
});

export const listCashFlowsSchema = z.object({
  query: z.object({
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
  }),
});

// Types (optional)
export type CreateOpeningInput = z.infer<typeof createOpeningSchema>['body'];
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>['body'];
export type AddClosingInput = z.infer<typeof addClosingSchema>['body'];
