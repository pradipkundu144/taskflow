import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9._-]+$/, 'invalid username'),
  email: z.string().email().toLowerCase(),
  password: z.string().min(12, 'min 12 chars').max(128),
  role: z.enum(['manager', 'teamLead', 'employee']),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
