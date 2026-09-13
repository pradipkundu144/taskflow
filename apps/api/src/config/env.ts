import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('localhost'),
  PORT: z.coerce.number().int().positive().default(3333),
  MONGO_URI: z.string().regex(/^mongodb(\+srv)?:\/\//, 'must be a mongodb uri'),
  REDIS_URL: z.string().regex(/^rediss?:\/\//, 'must be a redis uri'),
  JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'must be at least 32 chars'),
  REFRESH_COOKIE_SECRET: z.string().min(32, 'must be at least 32 chars'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  CORS_ORIGIN: z.string().default('*'),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_USERNAME: z.string().min(3).default('admin'),
  ADMIN_PASSWORD: z.string().min(12),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('invalid environment configuration:');
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  cached = parsed.data;
  return cached;
}
