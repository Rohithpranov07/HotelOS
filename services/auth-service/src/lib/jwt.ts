import { SignJWT, jwtVerify, importPKCS8, importSPKI, type JWTPayload } from 'jose';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';

export interface TokenPayload extends JWTPayload {
  userId: string;
  userType: 'guest' | 'staff';
  role?: string;
  propertyId?: string;
}

type Key = Awaited<ReturnType<typeof importPKCS8>>;

let privateKeyCache: Key | null = null;
let publicKeyCache: Key | null = null;

async function privateKey(): Promise<Key> {
  if (!privateKeyCache) privateKeyCache = await importPKCS8(config.jwtPrivateKey, 'RS256');
  return privateKeyCache;
}
async function publicKey(): Promise<Key> {
  if (!publicKeyCache) publicKeyCache = await importSPKI(config.jwtPublicKey, 'RS256');
  return publicKeyCache;
}

export async function signAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp' | 'jti'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(`${config.jwtAccessTtl}s`)
    .setJti(randomUUID())
    .sign(await privateKey());
}

export async function signRefreshToken(
  payload: Omit<TokenPayload, 'iat' | 'exp' | 'jti'>,
): Promise<{ token: string; jti: string }> {
  const jti = randomUUID();
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(`${config.jwtRefreshTtl}s`)
    .setJti(jti)
    .sign(await privateKey());
  return { token, jti };
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, await publicKey(), { algorithms: ['RS256'] });
  return payload as TokenPayload;
}
