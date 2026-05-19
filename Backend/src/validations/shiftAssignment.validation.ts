import { z } from 'zod';

export const assignShiftSchema = z.object({
  body: z.object({
    employee_id: z.string().uuid(),
    shift_time: z.string(),
    start_date: z.string().datetime(),
    end_date: z.string().datetime().optional().nullable(),
  }),
});

export const employeeIdParamSchema = z.object({
  params: z.object({
    employee_id: z.string().uuid(),
  }),
});
