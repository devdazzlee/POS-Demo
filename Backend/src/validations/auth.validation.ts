import { z } from 'zod';

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
    branch_id: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export { loginSchema, registerSchema };
