import { jwtVerify, importSPKI, type JWTPayload } from 'jose';
import { config } from '../config.js';

export interface TokenPayload extends JWTPayload {
  userId: string;
  userType: 'guest' | 'staff';
  role?: string;
  propertyId?: string;
  reservationId?: string;
}

type Key = Awaited<ReturnType<typeof importSPKI>>;

let publicKeyCache: Key | null = null;

async function publicKey(): Promise<Key> {
  if (!publicKeyCache) publicKeyCache = await importSPKI(config.jwtPublicKey, 'RS256');
  return publicKeyCache;
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, await publicKey(), { algorithms: ['RS256'] });
  return payload as TokenPayload;
}
