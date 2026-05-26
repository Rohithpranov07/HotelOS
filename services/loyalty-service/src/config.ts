import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3005),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),

  // App check-in bonus credited on booking.checked_out alongside earn points.
  APP_CHECKIN_BONUS: z.coerce.number().int().default(50),
  MIN_REDEMPTION_POINTS: z.coerce.number().int().default(500),

  WORKER_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  EXPIRY_CRON: z.string().default('5 0 * * *'), // 00:05 daily
  EXPIRY_TIMEZONE: z.string().default('Asia/Kolkata'),
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
  throw new Error('JWT public key required (JWT_PUBLIC_KEY or JWT_PUBLIC_KEY_PATH).');
}

export const config = {
  port: parsed.PORT,
  databaseUrl: parsed.DATABASE_URL,
  redisUrl: parsed.REDIS_URL,
  nodeEnv: parsed.NODE_ENV,
  jwtPublicKey,
  appCheckinBonus: parsed.APP_CHECKIN_BONUS,
  minRedemptionPoints: parsed.MIN_REDEMPTION_POINTS,
  workerEnabled: parsed.WORKER_ENABLED,
  expiryCron: parsed.EXPIRY_CRON,
  expiryTimezone: parsed.EXPIRY_TIMEZONE,
} as const;

export type Config = typeof config;
