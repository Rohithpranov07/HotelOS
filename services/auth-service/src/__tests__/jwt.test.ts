import { describe, it, expect } from 'vitest';
import { signAccessToken, signRefreshToken, verifyToken } from '../lib/jwt.js';

describe('jwt RS256', () => {
  it('signs and verifies an access token round-trip', async () => {
    const token = await signAccessToken({
      userId: 'guest-1',
      userType: 'guest',
      propertyId: 'prop-1',
    });
    const payload = await verifyToken(token);
    expect(payload.userId).toBe('guest-1');
    expect(payload.userType).toBe('guest');
    expect(payload.propertyId).toBe('prop-1');
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('refresh tokens include a unique jti', async () => {
    const a = await signRefreshToken({ userId: 'u1', userType: 'guest' });
    const b = await signRefreshToken({ userId: 'u1', userType: 'guest' });
    expect(a.jti).not.toBe(b.jti);
  });

  it('rejects a tampered token', async () => {
    const token = await signAccessToken({ userId: 'u1', userType: 'guest' });
    const tampered = token.slice(0, -4) + 'xxxx';
    await expect(verifyToken(tampered)).rejects.toThrow();
  });

  it('rejects an entirely fake token', async () => {
    await expect(verifyToken('not.a.jwt')).rejects.toThrow();
  });
});
