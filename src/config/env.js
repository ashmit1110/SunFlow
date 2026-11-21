import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1).default('file:./dev.db'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues.map(({ path, message }) => `${path.join('.')}: ${message}`).join('; ');
  throw new Error(`Invalid server environment: ${details}`);
}

if (result.data.NODE_ENV === 'production') {
  const secret = result.data.JWT_SECRET;
  const knownExamples = new Set([
    'replace-with-a-long-random-secret-before-running',
    'generate-a-local-secret-with-at-least-32-characters',
    'change-me',
    'development-secret-change-me',
  ]);
  if (secret.length < 64 || knownExamples.has(secret) || /(.)\1{15,}/.test(secret) || /^(secret|password|changeme)/i.test(secret)) {
    throw new Error('Production JWT_SECRET must be a unique, randomly generated value of at least 64 characters');
  }
}

export const env = {
  ...result.data,
  corsOrigins: result.data.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
};
