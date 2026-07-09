import { AppError } from './AppError';
import { ErrorCodes } from './types';

const AUTH_MESSAGE_PATTERNS: { pattern: RegExp; message: string }[] = [
  { pattern: /invalid login credentials/i, message: 'Email or password is incorrect.' },
  { pattern: /email not confirmed/i, message: 'Please confirm your email, then sign in.' },
  { pattern: /user already registered/i, message: 'An account with this email already exists.' },
  { pattern: /password.*(short|least|characters)/i, message: 'Password must be at least 6 characters.' },
  { pattern: /invalid email/i, message: 'Please enter a valid email address.' },
  { pattern: /rate limit/i, message: 'Too many attempts. Please wait and try again.' },
  { pattern: /network/i, message: "Couldn't reach the server. Check your connection." },
];

function mapRawAuthMessage(message: string): string {
  for (const { pattern, message: friendly } of AUTH_MESSAGE_PATTERNS) {
    if (pattern.test(message)) {
      return friendly;
    }
  }
  return "Couldn't sign you in. Please try again.";
}

export function toAuthError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    if (error.message === 'Google sign-in was cancelled') {
      return new AppError(ErrorCodes.AUTH_CANCELLED, 'Sign-in was cancelled.', { cause: error });
    }

    return new AppError(ErrorCodes.AUTH_FAILED, mapRawAuthMessage(error.message), {
      cause: error,
    });
  }

  return new AppError(ErrorCodes.AUTH_FAILED, "Couldn't sign you in. Please try again.");
}
