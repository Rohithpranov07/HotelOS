import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3004),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),

  KEY_PROVIDER: z.enum(['mock', 'assa_abloy', 'salto']).default('mock'),
  ASSA_ABLOY_BASE_URL: z.string().default('https://api.assaabloy.example.com/v1'),
  ASSA_ABLOY_API_KEY: z.string().optional(),

  // Keys expire on checkout day at this local hour (default 12:00).
  KEY_EXPIRY_HOUR: z.coerce.number().min(0).max(23).default(12),

  WORKER_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
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
    'JWT public key is required. Set JWT_PUBLIC_KEY or JWT_PUBLIC_KEY_PATH.',
  );
}

export const config = {
  port: parsed.PORT,
  databaseUrl: parsed.DATABASE_URL,
  redisUrl: parsed.REDIS_URL,
  nodeEnv: parsed.NODE_ENV,
  jwtPublicKey,
  keyProvider: parsed.KEY_PROVIDER,
  assaAbloy: {
    baseUrl: parsed.ASSA_ABLOY_BASE_URL,
    apiKey: parsed.ASSA_ABLOY_API_KEY ?? null,
  },
  keyExpiryHour: parsed.KEY_EXPIRY_HOUR,
  workerEnabled: parsed.WORKER_ENABLED,
} as const;

export type Config = typeof config;
