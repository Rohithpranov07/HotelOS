import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3002),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),

  CLOUDBEDS_API_URL: z.string().default('https://api.cloudbeds.com/api/v1.1'),
  CLOUDBEDS_API_KEY: z.string().optional(),
  CLOUDBEDS_WEBHOOK_SECRET: z.string().default('dev-webhook-secret-change-me'),
  CLOUDBEDS_PROPERTY_ID: z.string().optional(),

  PMS_SYNC_INTERVAL_MS: z.coerce.number().default(5 * 60 * 1000),
  PMS_SYNC_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

const parsed = ConfigSchema.parse(process.env);

function readKey(inline: string | undefined, p: string | undefined): string | null {
  if (inline) return inline.replace(/\\n/g, '\n');
  if (p) {
    const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
    return fs.readFileSync(abs, 'utf8');
  }
  return null;
}

const jwtPublicKey = readKey(parsed.JWT_PUBLIC_KEY, parsed.JWT_PUBLIC_KEY_PATH);
if (!jwtPublicKey) {
  throw new Error(
    'JWT public key is required. Set JWT_PUBLIC_KEY (inline PEM) or JWT_PUBLIC_KEY_PATH (file path).',
  );
}

export const config = {
  port: parsed.PORT,
  databaseUrl: parsed.DATABASE_URL,
  redisUrl: parsed.REDIS_URL,
  nodeEnv: parsed.NODE_ENV,
  jwtPublicKey,
  cloudbeds: {
    apiUrl: parsed.CLOUDBEDS_API_URL,
    apiKey: parsed.CLOUDBEDS_API_KEY ?? null,
    webhookSecret: parsed.CLOUDBEDS_WEBHOOK_SECRET,
    propertyId: parsed.CLOUDBEDS_PROPERTY_ID ?? null,
  },
  pmsSync: {
    intervalMs: parsed.PMS_SYNC_INTERVAL_MS,
    enabled: parsed.PMS_SYNC_ENABLED,
  },
} as const;

export type Config = typeof config;
