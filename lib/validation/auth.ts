import { z } from 'zod';

// Shared input rules for the auth forms. One place for the password policy
// so sign-up and password-reset can't drift apart.

export const emailSchema = z.email('Invalid email address').max(254);

// Supabase hashes with bcrypt, which only looks at the first 72 bytes — a
// longer password would silently be truncated, so it's rejected instead.
// The complexity rules mirror what the sign-up and reset forms enforce
// client-side.
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .max(72, 'Password must be at most 72 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number');

export const fullNameSchema = z.string().trim().min(1).max(100);
