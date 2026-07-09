import { Alert } from 'react-native';
import { getAccessToken, signOut } from '@/lib/auth';
import { usePlanStore } from '@/store/usePlanStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function handleUnauthorized() {
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
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (options.auth !== false) {
    const token = await getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();

  if (response.status === 401) {
    await handleUnauthorized();
    throw new Error('Session expired');
  }

  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed (${response.status})`);
  }

  return data as T;
}
