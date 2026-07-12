import { Alert } from 'react-native';
import { getAccessToken, signOut } from '@/lib/auth';
import { ApiError, ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import type { ApiErrorBody } from '@/lib/errors';
import { createLogger } from '@/lib/logger';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useUserStore } from '@/store/useUserStore';

const log = createLogger('api');

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const REQUEST_TIMEOUT_MS = 30_000;

async function handleUnauthorized(path: string) {
  log.warn('Session expired', { path });
  await signOut();
  usePlanStore.getState().clearSession();
  usePreferencesStore.getState().clearSession();
  useUserStore.getState().clearSession();
  Alert.alert('Session expired', getKnownUserMessage(ErrorCodes.SESSION_EXPIRED));
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE' | 'PATCH';
  body?: unknown;
  auth?: boolean;
  /** Override default 30s timeout (e.g. materialize LLM calls). */
  timeoutMs?: number;
};

async function parseResponseBody(response: Response): Promise<ApiErrorBody> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as ApiErrorBody;
  } catch {
    log.warn('Non-JSON API response', { status: response.status });
    return {};
  }
}

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

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      log.error('API request timed out', { method, path });
      throw new ApiError(408, ErrorCodes.NETWORK_ERROR, getKnownUserMessage(ErrorCodes.NETWORK_ERROR), {
        cause: err,
      });
    }

    log.error('API network error', {
      method,
      path,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    throw new ApiError(0, ErrorCodes.NETWORK_ERROR, getKnownUserMessage(ErrorCodes.NETWORK_ERROR), {
      cause: err,
    });
  } finally {
    clearTimeout(timeout);
  }

  const data = await parseResponseBody(response);

  if (response.status === 401) {
    await handleUnauthorized(path);
    throw new ApiError(401, ErrorCodes.SESSION_EXPIRED, getKnownUserMessage(ErrorCodes.SESSION_EXPIRED), {
      requestId: data.requestId,
    });
  }

  if (!response.ok) {
    const apiError = ApiError.fromResponse(response.status, data);
    log.error('API request failed', {
      method,
      path,
      status: response.status,
      code: apiError.code,
      requestId: apiError.requestId,
    });
    throw apiError;
  }

  log.debug('API response', { method, path, status: response.status });
  return data as T;
}
