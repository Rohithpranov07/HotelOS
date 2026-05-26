import axios from 'axios';
import type {
  IKeyProvider,
  KeyProvisionParams,
  KeyProvisionResult,
  LockType,
} from './key-provider.interface.js';

interface AssaAbloyProvisionResponse {
  mobileKey: string;
  credentialId: string;
}

/**
 * ASSA ABLOY Visionline Cloud Key API stub.
 * Real deployment needs hardware-provisioned credentials; for now it just shapes
 * the HTTP contract so the integration is a one-config switch later.
 */
export class AssaAbloyProvider implements IKeyProvider {
  readonly lockType: LockType = 'assa_abloy';

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async provisionKey(params: KeyProvisionParams): Promise<KeyProvisionResult> {
    const response = await axios.post<AssaAbloyProvisionResponse>(
      `${this.baseUrl}/openings/${encodeURIComponent(params.lockDeviceId)}/credentials`,
      {
        startValidity: params.validFrom.toISOString(),
        endValidity: params.validUntil.toISOString(),
        label: `${params.guestName} - Room ${params.roomNumber}`,
      },
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: 10_000,
      },
    );
    return {
      keyToken: response.data.mobileKey,
      lockDeviceId: params.lockDeviceId,
      validFrom: params.validFrom,
      validUntil: params.validUntil,
      providerKeyId: response.data.credentialId,
      lockType: 'assa_abloy',
    };
  }

  async revokeKey(providerKeyId: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/credentials/${encodeURIComponent(providerKeyId)}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      timeout: 10_000,
    });
  }
}
