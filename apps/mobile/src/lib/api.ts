import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { storage, StorageKeys } from './storage';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:3001';

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = storage.getString(StorageKeys.AccessToken);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const cfg = error.config as RetryConfig | undefined;
    if (error.response?.status === 401 && cfg && !cfg._retry) {
      cfg._retry = true;
      const refreshToken = storage.getString(StorageKeys.RefreshToken);
      if (!refreshToken) return Promise.reject(error);
      try {
        const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });
        storage.set(StorageKeys.AccessToken, data.access_token);
        storage.set(StorageKeys.RefreshToken, data.refresh_token);
        cfg.headers.Authorization = `Bearer ${data.access_token}`;
        return api(cfg);
      } catch {
        storage.delete(StorageKeys.AccessToken);
        storage.delete(StorageKeys.RefreshToken);
      }
    }
    return Promise.reject(error);
  },
);
