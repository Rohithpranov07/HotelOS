import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3007),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().default('noreply@hotelosapp.io'),

  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET: z.string().optional(),

  HOTEL_NAME: z.string().default('Hotel OS'),
  HOTEL_ADDRESS: z.string().default(''),

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
  throw new Error('JWT public key required (JWT_PUBLIC_KEY or JWT_PUBLIC_KEY_PATH).');
}

export const config = {
  port: parsed.PORT,
  databaseUrl: parsed.DATABASE_URL,
  redisUrl: parsed.REDIS_URL,
  nodeEnv: parsed.NODE_ENV,
  jwtPublicKey,
  razorpay: {
    keyId: parsed.RAZORPAY_KEY_ID ?? null,
    keySecret: parsed.RAZORPAY_KEY_SECRET ?? null,
  },
  sendgrid: {
    apiKey: parsed.SENDGRID_API_KEY ?? null,
    fromEmail: parsed.SENDGRID_FROM_EMAIL,
  },
  aws: {
    accessKeyId: parsed.AWS_ACCESS_KEY_ID ?? null,
    secretAccessKey: parsed.AWS_SECRET_ACCESS_KEY ?? null,
    region: parsed.AWS_REGION,
    s3Bucket: parsed.AWS_S3_BUCKET ?? null,
  },
  hotel: {
    name: parsed.HOTEL_NAME,
    address: parsed.HOTEL_ADDRESS,
  },
  workerEnabled: parsed.WORKER_ENABLED,
} as const;

export type Config = typeof config;

export const hasRazorpay = Boolean(config.razorpay.keyId && config.razorpay.keySecret);
export const hasSendgrid = Boolean(config.sendgrid.apiKey);
export const hasS3 = Boolean(
  config.aws.accessKeyId && config.aws.secretAccessKey && config.aws.s3Bucket,
);
