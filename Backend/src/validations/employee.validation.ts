import { z } from 'zod';

export const createEmployeeSchema = z.object({
  body: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone_number: z.string().optional(),
    cnic: z.string().optional(),
    gender: z.string().optional(),
    join_date: z.string().datetime(),
    employee_type_id: z.string().uuid(),
  }),
});

export const updateEmployeeSchema = z.object({
  body: z.object({
    // When `name` is sent, it must still be a real name. Without a length
    // check the backend silently accepts "" and the row's name disappears.
    name: z.string().trim().min(2, 'Full name must be at least 2 characters').optional(),
    // Optional fields accept `null` so clearing them on the UI actually
    // clears them in the database (the columns are `String?` in Prisma).
    // For email we still validate format when a string is provided.
    email: z.string().email().nullable().optional(),
    phone_number: z.string().nullable().optional(),
    cnic: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
    join_date: z.string().datetime().optional(),
    employee_type_id: z.string().uuid().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const deleteEmployeeSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listEmployeeSchema = z.object({
  query: z.object({
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
  }),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>['body'];

export const createEmployeeTypeSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    // Optional on the wire — when present, the service honors it. When
    // absent, Prisma falls back to the model's @default(true).
    is_active: z.boolean().optional(),
  }),
});

export const updateEmployeeTypeSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    is_active: z.boolean().optional(),
  }),
});