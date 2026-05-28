import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { decodeJwt } from 'jose';
import {
  SendOtpRequestSchema,
  VerifyOtpRequestSchema,
  StaffLoginRequestSchema,
  RefreshRequestSchema,
} from '@hotel-os/types';

import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import {
  checkOtpRateLimit,
  storeOtp,
  verifyOtp,
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
} from '../lib/redis.js';
import { generateOtp, sendOtpSms } from '../lib/firebase.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const errBody = (code: string, message: string, extra: Record<string, unknown> = {}) => ({
  error: { code, message, ...extra },
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // ─── POST /otp/send ─────────────────────────────────────────────
  app.post('/otp/send', async (request, reply) => {
    const parsed = SendOtpRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send(errBody('VALIDATION_ERROR', 'Invalid request body', { details: parsed.error.issues }));
    }
    const { phone } = parsed.data;

    const rate = await checkOtpRateLimit(phone);
    if (!rate.allowed) {
      reply.header('Retry-After', String(rate.retryAfter));
      return reply
        .status(429)
        .send(errBody('RATE_LIMITED', 'Too many OTP requests', { retry_after: rate.retryAfter }));
    }

    const code = generateOtp();
    await storeOtp(phone, code);
    try {
      await sendOtpSms(phone, code);
    } catch (err) {
      request.log.error({ err, phone }, 'sendOtpSms failed');
      return reply.status(503).send(errBody('SMS_PROVIDER_DOWN', 'Unable to send OTP right now'));
    }

    return reply.send({ success: true, expires_in: config.otp.ttlSeconds });
  });

  // ─── POST /otp/verify ───────────────────────────────────────────
  app.post('/otp/verify', async (request, reply) => {
    const parsed = VerifyOtpRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send(errBody('VALIDATION_ERROR', 'Invalid request body', { details: parsed.error.issues }));
    }
    const { phone, otp } = parsed.data;

    // Dev bypass: accept a hardcoded master OTP outside production while we wire up
    // a real provider (e.g. Firebase Phone Auth). Remove once SMS is live.
    const masterOtp = process.env.DEV_MASTER_OTP ?? '123456';
    const isMasterBypass = config.nodeEnv !== 'production' && otp === masterOtp;

    const result = isMasterBypass
      ? ({ kind: 'ok' as const })
      : await verifyOtp(phone, otp);
    if (result.kind === 'expired') {
      return reply.status(401).send(errBody('OTP_EXPIRED', 'OTP has expired'));
    }
    if (result.kind === 'locked') {
      return reply
        .status(429)
        .send(errBody('OTP_MAX_ATTEMPTS', 'Account locked. Try again in 15 minutes.'));
    }
    if (result.kind === 'invalid') {
      return reply
        .status(401)
        .send(
          errBody('OTP_INVALID', 'Invalid OTP', { attempts_remaining: result.attemptsRemaining }),
        );
    }

    // Need a property to attach a brand-new guest to. Pick the first active property
    // for now; multi-property routing comes in a later task.
    const property = await prisma.property.findFirst({ where: { isActive: true } });
    if (!property) {
      return reply
        .status(500)
        .send(errBody('NO_PROPERTY', 'No active property configured. Run pnpm seed.'));
    }

    const existing = await prisma.guest.findUnique({ where: { phone } });
    const guest = existing
      ? existing
      : await prisma.guest.create({
          data: {
            phone,
            fullName: 'Guest',
            propertyId: property.id,
          },
        });

    const tokenPayload = {
      userId: guest.id,
      userType: 'guest' as const,
      propertyId: guest.propertyId,
    };
    const accessToken = await signAccessToken(tokenPayload);
    const { token: refreshToken, jti } = await signRefreshToken(tokenPayload);
    await storeRefreshToken(jti, tokenPayload, config.jwtRefreshTtl);

    return reply.send({
      access_token: accessToken,
      refresh_token: refreshToken,
      guest: {
        id: guest.id,
        phone: guest.phone,
        full_name: guest.fullName,
        loyalty_tier: guest.loyaltyTier,
        loyalty_points: guest.loyaltyPoints,
        is_new: !existing,
      },
    });
  });

  // ─── POST /staff/login ──────────────────────────────────────────
  app.post('/staff/login', async (request, reply) => {
    const parsed = StaffLoginRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send(errBody('VALIDATION_ERROR', 'Invalid request body', { details: parsed.error.issues }));
    }
    const { email, password, totp_code } = parsed.data;

    const staff = await prisma.staff.findUnique({ where: { email } });
    if (!staff || !staff.isActive) {
      return reply.status(401).send(errBody('AUTH_FAILED', 'Invalid credentials'));
    }

    const passwordOk = await bcrypt.compare(password, staff.passwordHash);
    if (!passwordOk) {
      return reply.status(401).send(errBody('AUTH_FAILED', 'Invalid credentials'));
    }

    if (staff.totpSecret) {
      if (!totp_code) {
        return reply.status(401).send(errBody('TOTP_REQUIRED', '2FA code required'));
      }
      const valid = speakeasy.totp.verify({
        secret: staff.totpSecret,
        encoding: 'base32',
        token: totp_code,
        window: 1,
      });
      if (!valid) {
        return reply.status(401).send(errBody('TOTP_INVALID', 'Invalid 2FA code'));
      }
    }

    const tokenPayload = {
      userId: staff.id,
      userType: 'staff' as const,
      role: staff.role,
      propertyId: staff.propertyId,
    };
    const accessToken = await signAccessToken(tokenPayload);
    const { token: refreshToken, jti } = await signRefreshToken(tokenPayload);
    await storeRefreshToken(jti, tokenPayload, config.jwtRefreshTtl);

    return reply.send({
      access_token: accessToken,
      refresh_token: refreshToken,
      staff: {
        id: staff.id,
        email: staff.email,
        full_name: staff.fullName,
        role: staff.role,
        property_id: staff.propertyId,
      },
    });
  });

  // ─── POST /refresh ──────────────────────────────────────────────
  app.post('/refresh', async (request, reply) => {
    const parsed = RefreshRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send(errBody('VALIDATION_ERROR', 'Invalid request body', { details: parsed.error.issues }));
    }

    let payload;
    try {
      payload = await verifyToken(parsed.data.refresh_token);
    } catch {
      return reply.status(401).send(errBody('TOKEN_INVALID', 'Refresh token invalid or expired'));
    }

    const oldJti = (payload.jti as string | undefined) ?? '';
    const stored = await getRefreshToken(oldJti);
    if (!stored) {
      return reply.status(401).send(errBody('TOKEN_INVALID', 'Refresh token revoked'));
    }

    await deleteRefreshToken(oldJti);

    const newPayload = {
      userId: stored.userId,
      userType: stored.userType,
      role: stored.role,
      propertyId: stored.propertyId,
    };
    const accessToken = await signAccessToken(newPayload);
    const { token: refreshToken, jti } = await signRefreshToken(newPayload);
    await storeRefreshToken(jti, stored, config.jwtRefreshTtl);

    return reply.send({ access_token: accessToken, refresh_token: refreshToken });
  });

  // ─── POST /logout ───────────────────────────────────────────────
  app.post('/logout', { preHandler: requireAuth }, async (request, reply) => {
    const header = request.headers.authorization ?? '';
    const token = header.slice(7);
    try {
      const decoded = decodeJwt(token);
      if (decoded.jti) await deleteRefreshToken(decoded.jti);
    } catch {
      // ignore — already invalid
    }
    return reply.send({ success: true });
  });

  // ─── GET /me ────────────────────────────────────────────────────
  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    if (!user) {
      return reply.status(401).send(errBody('AUTH_REQUIRED', 'Authentication required'));
    }

    if (user.userType === 'guest') {
      const guest = await prisma.guest.findUnique({ where: { id: user.userId } });
      if (!guest) return reply.status(404).send(errBody('NOT_FOUND', 'Guest not found'));
      return reply.send({
        user_type: 'guest',
        id: guest.id,
        phone: guest.phone,
        email: guest.email,
        full_name: guest.fullName,
        loyalty_tier: guest.loyaltyTier,
        loyalty_points: guest.loyaltyPoints,
        property_id: guest.propertyId,
      });
    }

    const staff = await prisma.staff.findUnique({ where: { id: user.userId } });
    if (!staff) return reply.status(404).send(errBody('NOT_FOUND', 'Staff not found'));
    return reply.send({
      user_type: 'staff',
      id: staff.id,
      email: staff.email,
      full_name: staff.fullName,
      role: staff.role,
      property_id: staff.propertyId,
    });
  });
}
