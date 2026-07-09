import { Alert } from 'react-native';
import { getAccessToken, signOut } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { usePlanStore } from '@/store/usePlanStore';

const log = createLogger('api');

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function handleUnauthorized(path: string) {
  log.warn('Session expired', { path });
  await signOut();
  usePlanStore.getState().clearSession();
  Alert.alert('Session expired', 'Please sign in again.');
}

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (options.auth !== false) {
    const token = await getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  log.debug('API request', { method, path });

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();

  if (response.status === 401) {
    await handleUnauthorized(path);
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const message = data?.error ?? `Request failed (${response.status})`;
    log.error('API request failed', {
      method,
      path,
      status: response.status,
      requestId: data?.requestId,
      error: message,
    });
    throw new Error(message);
  }

  log.debug('API response', { method, path, status: response.status });
  return data as T;
}
