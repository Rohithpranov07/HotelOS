import { randomBytes } from 'node:crypto';
import type {
  IKeyProvider,
  KeyProvisionParams,
  KeyProvisionResult,
  LockType,
} from './key-provider.interface.js';

/**
 * MockKeyProvider — drop-in stand-in for ASSA ABLOY / Salto in dev and tests.
 * Simulates a small API latency so timing-sensitive tests behave realistically.
 */
export class MockKeyProvider implements IKeyProvider {
  readonly lockType: LockType = 'mock';
  readonly latencyMs: number;
  readonly revokedKeys = new Set<string>();

  constructor(latencyMs = 50) {
    this.latencyMs = latencyMs;
  }

  async provisionKey(params: KeyProvisionParams): Promise<KeyProvisionResult> {
    if (this.latencyMs > 0) await new Promise((r) => setTimeout(r, this.latencyMs));
    return {
      keyToken: `MOCK_BLE_${randomBytes(16).toString('hex').toUpperCase()}`,
      lockDeviceId: params.lockDeviceId || `MOCK_LOCK_${params.roomNumber}`,
      validFrom: params.validFrom,
      validUntil: params.validUntil,
      providerKeyId: `mock-key-${randomBytes(8).toString('hex')}`,
      lockType: 'mock',
    };
  }

  async revokeKey(providerKeyId: string): Promise<void> {
    if (this.latencyMs > 0) await new Promise((r) => setTimeout(r, this.latencyMs));
    this.revokedKeys.add(providerKeyId);
  }
}
