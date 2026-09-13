import {
  OPERATIONAL_ROLES,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '@taskflow/shared';
import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(USERNAME_MIN_LENGTH)
    .max(USERNAME_MAX_LENGTH)
    .regex(USERNAME_PATTERN, 'invalid username'),
  email: z.string().email().toLowerCase(),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `min ${PASSWORD_MIN_LENGTH} chars`)
    .max(PASSWORD_MAX_LENGTH),
  role: z.enum(OPERATIONAL_ROLES),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
