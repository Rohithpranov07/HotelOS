// BLE unlock client for ASSA ABLOY-compatible smart locks.
//
// react-native-ble-plx requires a custom dev client / native build, which the
// Hotel OS demo harness doesn't ship by default. We dynamically resolve the
// module so the app keeps running under Expo Go via MockBleUnlock, and only
// engages real BLE when EXPO_PUBLIC_BLE_MOCK=false in a dev-client build.

type BleManagerLike = {
  startDeviceScan: (
    uuids: string[] | null,
    options: unknown,
    cb: (err: Error | null, device: BleDeviceLike | null) => void,
  ) => void;
  stopDeviceScan: () => void;
};

type BleDeviceLike = {
  id: string;
  name?: string | null;
  connect: () => Promise<BleConnectedLike>;
};

type BleConnectedLike = {
  discoverAllServicesAndCharacteristics: () => Promise<unknown>;
  writeCharacteristicWithResponseForService: (
    serviceUuid: string,
    charUuid: string,
    base64Value: string,
  ) => Promise<unknown>;
  cancelConnection: () => Promise<unknown>;
};

const LOCK_SERVICE_UUID = '00001234-0000-1000-8000-00805f9b34fb';
const LOCK_CHAR_UUID = '00001235-0000-1000-8000-00805f9b34fb';

function toBase64(input: string): string {
  if (typeof globalThis.btoa === 'function') return globalThis.btoa(input);
  // RN polyfill fallback (rare path).
  return Buffer.from(input, 'utf-8').toString('base64');
}

async function getBleManager(): Promise<BleManagerLike | null> {
  try {
    // Lazy-load so Metro/TS don't fail when the optional native module is absent.
    const moduleName = 'react-native-ble-plx';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = (await (Function('m', 'return import(m)')(moduleName) as Promise<any>)) as {
      BleManager: new () => BleManagerLike;
    };
    return new mod.BleManager();
  } catch {
    return null;
  }
}

async function scanForLock(
  manager: BleManagerLike,
  deviceId: string,
): Promise<BleDeviceLike> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      manager.stopDeviceScan();
      reject(new Error('Lock not found within range'));
    }, 10_000);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        clearTimeout(timeout);
        manager.stopDeviceScan();
        reject(error);
        return;
      }
      if (device && (device.id === deviceId || device.name?.includes('HotelLock'))) {
        clearTimeout(timeout);
        manager.stopDeviceScan();
        resolve(device);
      }
    });
  });
}

export async function unlockWithBle(
  keyToken: string,
  lockDeviceId: string,
): Promise<void> {
  const manager = await getBleManager();
  if (!manager) {
    throw new Error('BLE not available — falling back to mock unlock in dev');
  }

  const device = await scanForLock(manager, lockDeviceId);
  const connected = await device.connect();
  await connected.discoverAllServicesAndCharacteristics();
  await connected.writeCharacteristicWithResponseForService(
    LOCK_SERVICE_UUID,
    LOCK_CHAR_UUID,
    toBase64(keyToken),
  );
  await connected.cancelConnection();
}

// Dev-mode unlock: 1.8s simulated handshake, always succeeds. Mirrors the
// happy-path latency of a real BLE write so animations don't snap.
export async function MockBleUnlock(_keyToken: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 1800));
}
