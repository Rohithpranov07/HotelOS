import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3003),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),

  KITCHEN_OPEN: z.string().default('07:00'),
  KITCHEN_CLOSE: z.string().default('23:00'),
  SLA_WARNING_LEAD_MINUTES: z.coerce.number().default(10),
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
  kitchen: { open: parsed.KITCHEN_OPEN, close: parsed.KITCHEN_CLOSE },
  slaWarningLeadMinutes: parsed.SLA_WARNING_LEAD_MINUTES,
} as const;

export type Config = typeof config;
