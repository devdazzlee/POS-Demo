import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const addressSchema = z
  .object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
  })
  .optional();

// For guest checkout
const createGuestUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().min(6, 'Invalid phone number').optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    address: addressSchema,
  }),
});

// For user registration
const registerUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().min(6, 'Invalid phone number').optional(),
    password: passwordSchema,
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    address: addressSchema,
  }),
});

// For profile updates
const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().min(6, 'Invalid phone number').optional(),
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    address: addressSchema,
  }),
});

const loginSchema = z.object({
  body: z
    .object({
      email: z.string().email('Invalid email address').optional(),
      phone: z.string().min(6, 'Invalid phone number').optional(),
      password: z.string().min(1, 'Password is required'),
    })
    .refine((data) => data.email || data.phone, {
      message: 'Either email or phone must be provided',
    }),
});

const verifyOTPSchema = z.object({
  body: z
    .object({
      email: z.string().email('Invalid email address').optional(),
      phone: z.string().min(6, 'Invalid phone number').optional(),
      otp: z.string().min(4, 'OTP must be at least 4 digits'),
    })
    .refine((data) => data.email || data.phone, {
      message: 'Either email or phone must be provided',
    }),
});

export {
  createGuestUserSchema,
  registerUserSchema,
  updateUserSchema,
  loginSchema,
  verifyOTPSchema,
};
