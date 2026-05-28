import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import Constants from 'expo-constants';
import { storage, StorageKeys } from './storage';

type ServiceKey = 'auth' | 'booking' | 'orders' | 'ai' | 'payments' | 'loyalty' | 'access';

const DEFAULT_PORTS: Record<ServiceKey, number> = {
  auth: 3001,
  booking: 3002,
  orders: 3003,
  access: 3004,
  ai: 3006,
  payments: 3007,
  loyalty: 3005,
};

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

function baseUrlFor(service: ServiceKey): string {
  const envKey = `EXPO_PUBLIC_${service.toUpperCase()}_API_URL`;
  const fromEnv = (process.env as Record<string, string | undefined>)[envKey];
  if (fromEnv) return fromEnv;
  if (extra[envKey]) return extra[envKey]!;
  // Fallback: derive host from EXPO_PUBLIC_API_URL or localhost, swap port.
  const root =
    process.env.EXPO_PUBLIC_API_URL ??
    (extra.apiUrl as string | undefined) ??
    'http://localhost:3001';
  return root.replace(/:\d+(\/.*)?$/, `:${DEFAULT_PORTS[service]}`);
}

function createClient(service: ServiceKey): AxiosInstance {
  const baseURL = `${baseUrlFor(service)}/api/v1`;
  const client = axios.create({
    baseURL,
    timeout: 10_000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = storage.getString(StorageKeys.AccessToken);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
  client.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const cfg = error.config as RetryConfig | undefined;
      if (error.response?.status === 401 && cfg && !cfg._retry) {
        cfg._retry = true;
        const refreshToken = storage.getString(StorageKeys.RefreshToken);
        if (!refreshToken) return Promise.reject(error);
        try {
          const { data } = await axios.post(
            `${baseUrlFor('auth')}/api/v1/auth/refresh`,
            { refresh_token: refreshToken },
          );
          storage.set(StorageKeys.AccessToken, data.access_token);
          storage.set(StorageKeys.RefreshToken, data.refresh_token);
          cfg.headers.Authorization = `Bearer ${data.access_token}`;
          return client(cfg);
        } catch {
          storage.delete(StorageKeys.AccessToken);
          storage.delete(StorageKeys.RefreshToken);
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export const api = createClient('auth');
export const bookingApi = createClient('booking');
export const ordersApi = createClient('orders');
export const aiApi = createClient('ai');
export const paymentsApi = createClient('payments');
export const loyaltyApi = createClient('loyalty');
export const accessApi = createClient('access');
