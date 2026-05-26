export type LockType = 'mock' | 'assa_abloy' | 'salto';

export interface KeyProvisionParams {
  reservationId: string;
  roomNumber: string;
  lockDeviceId: string;
  validFrom: Date;
  validUntil: Date;
  guestName: string;
}

export interface KeyProvisionResult {
  keyToken: string;
  lockDeviceId: string;
  validFrom: Date;
  validUntil: Date;
  providerKeyId: string;
  lockType: LockType;
}

export interface IKeyProvider {
  readonly lockType: LockType;
  provisionKey(params: KeyProvisionParams): Promise<KeyProvisionResult>;
  revokeKey(providerKeyId: string): Promise<void>;
}
