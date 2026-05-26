import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(2592000),

  // JWT keys: either inline PEM (JWT_PRIVATE_KEY) or path (JWT_PRIVATE_KEY_PATH).
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PRIVATE_KEY_PATH: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),

  // Firebase: inline JSON or path. Optional in dev (OTP is logged).
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),

  OTP_TTL_SECONDS: z.coerce.number().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(3),
  OTP_RATE_LIMIT: z.coerce.number().default(3),
  OTP_RATE_WINDOW_SECONDS: z.coerce.number().default(900),
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

const jwtPrivateKey = readKey(parsed.JWT_PRIVATE_KEY, parsed.JWT_PRIVATE_KEY_PATH);
const jwtPublicKey = readKey(parsed.JWT_PUBLIC_KEY, parsed.JWT_PUBLIC_KEY_PATH);

if (!jwtPrivateKey || !jwtPublicKey) {
  throw new Error(
    'JWT keys are required. Set JWT_PRIVATE_KEY/JWT_PUBLIC_KEY (inline PEM) ' +
      'or JWT_PRIVATE_KEY_PATH/JWT_PUBLIC_KEY_PATH (file path). ' +
      'Run scripts/generate-jwt-keys.sh to create a dev keypair.',
  );
}

let firebaseServiceAccount: string | null = null;
if (parsed.FIREBASE_SERVICE_ACCOUNT) {
  firebaseServiceAccount = parsed.FIREBASE_SERVICE_ACCOUNT;
} else if (parsed.FIREBASE_SERVICE_ACCOUNT_PATH) {
  const abs = path.isAbsolute(parsed.FIREBASE_SERVICE_ACCOUNT_PATH)
    ? parsed.FIREBASE_SERVICE_ACCOUNT_PATH
    : path.resolve(process.cwd(), parsed.FIREBASE_SERVICE_ACCOUNT_PATH);
  if (fs.existsSync(abs)) {
    firebaseServiceAccount = fs.readFileSync(abs, 'utf8');
  }
}

export const config = {
  port: parsed.PORT,
  databaseUrl: parsed.DATABASE_URL,
  redisUrl: parsed.REDIS_URL,
  nodeEnv: parsed.NODE_ENV,
  jwtPrivateKey,
  jwtPublicKey,
  jwtAccessTtl: parsed.JWT_ACCESS_TTL,
  jwtRefreshTtl: parsed.JWT_REFRESH_TTL,
  firebaseServiceAccount,
  otp: {
    ttlSeconds: parsed.OTP_TTL_SECONDS,
    maxAttempts: parsed.OTP_MAX_ATTEMPTS,
    rateLimit: parsed.OTP_RATE_LIMIT,
    rateWindowSeconds: parsed.OTP_RATE_WINDOW_SECONDS,
  },
} as const;

export type Config = typeof config;
