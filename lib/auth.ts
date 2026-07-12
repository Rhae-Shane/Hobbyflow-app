import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { createLogger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

const log = createLogger('auth');

WebBrowser.maybeCompleteAuthSession();

/** Standalone APK/IPA: hobbyflow://auth/callback — must be allow-listed in Supabase Auth. */
const redirectTo = makeRedirectUri({
  scheme: 'hobbyflow',
  path: 'auth/callback',
});

log.info('OAuth redirect URI', { redirectTo });

export function getOAuthRedirectUri() {
  return redirectTo;
}

export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(errorCode);
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (!accessToken) {
    return null;
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken ?? '',
  });

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signInWithGoogle() {
  log.info('Starting Google sign-in');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    log.error('Google sign-in failed', { error: error.message });
    throw error;
  }

  if (!data.url) {
    log.error('Google sign-in URL missing');
    throw new Error('Google sign-in URL was not returned');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success') {
    log.warn('Google sign-in cancelled');
    throw new Error('Google sign-in was cancelled');
  }

  const session = await createSessionFromUrl(result.url);
  log.info('Google sign-in succeeded', { userId: session?.user?.id });
  return session;
}

export async function signInWithEmail(email: string, password: string) {
  log.info('Starting email sign-in', { email });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    log.warn('Email sign-in failed', { email, error: error.message });
    throw error;
  }

  log.info('Email sign-in succeeded', { userId: data.session?.user?.id });
  return data.session;
}

export async function signUpWithEmail(email: string, password: string) {
  log.info('Starting email sign-up', { email });

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    log.warn('Email sign-up failed', { email, error: error.message });
    throw error;
  }

  log.info('Email sign-up succeeded', { userId: data.session?.user?.id });
  return data.session;
}

export async function signOut() {
  log.info('Signing out');

  const { error } = await supabase.auth.signOut();

  if (error) {
    log.error('Sign-out failed', { error: error.message });
    throw error;
  }

  log.info('Sign-out succeeded');
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
