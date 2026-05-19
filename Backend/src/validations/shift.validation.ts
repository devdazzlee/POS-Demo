import { z } from 'zod';

export const createShiftSchema = z.object({
  body: z.object({
    name: z.string(),
    start_time: z.string().datetime(),
    end_time: z.string().datetime(),
  }),
});

export const listShiftsSchema = z.object({
  query: z.object({
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
  }),
});

export const shiftIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>['body'];
