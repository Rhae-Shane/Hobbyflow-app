import type { ErrorCode } from './types';
import { ErrorCodes } from './types';

const USER_MESSAGES: Record<string, string> = {
  [ErrorCodes.NETWORK_ERROR]:
    "Couldn't reach the server. Check your connection and try again.",
  [ErrorCodes.PARSE_ERROR]: 'Something went wrong. Please try again.',
  [ErrorCodes.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
  [ErrorCodes.AUTH_MISSING_HEADER]: 'Please sign in to continue.',
  [ErrorCodes.AUTH_MISSING_TOKEN]: 'Please sign in to continue.',
  [ErrorCodes.AUTH_INVALID_SESSION]: 'Your session has expired. Please sign in again.',
  [ErrorCodes.AUTH_SERVICE_UNAVAILABLE]:
    'Sign-in is temporarily unavailable. Please try again.',
  [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCodes.INVALID_JSON]: 'Something went wrong. Please try again.',
  [ErrorCodes.NOT_FOUND]: "We couldn't find what you were looking for.",
  [ErrorCodes.RATE_LIMITED]: 'Too many requests. Please wait a few minutes and try again.',
  [ErrorCodes.PLANNER_UNAVAILABLE]:
    "Couldn't generate your roadmap right now. Please try again in a moment.",
  [ErrorCodes.DUPLICATE_TECHNIQUE]:
    "Couldn't find a unique replacement — keep your current technique.",
  [ErrorCodes.INVALID_TECHNIQUE_ID]: 'That technique is no longer available.',
  [ErrorCodes.INTERNAL_ERROR]: 'Something went wrong. Please try again.',
  [ErrorCodes.AUTH_CANCELLED]: 'Sign-in was cancelled.',
  [ErrorCodes.AUTH_FAILED]: "Couldn't sign you in. Please try again.",
  [ErrorCodes.SYNC_FAILED]: "Couldn't sync your progress. Your changes are saved locally.",
  [ErrorCodes.BROWSER_UNAVAILABLE]: "Couldn't open the resource. Please try again.",
  [ErrorCodes.UNKNOWN]: 'Something went wrong. Please try again.',
};

function statusFallback(status: number): string {
  if (status === 400) return 'Please check your input and try again.';
  if (status === 401) return 'Please sign in to continue.';
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status === 409) return 'That action is not available right now.';
  if (status === 429) return 'Too many requests. Please wait and try again.';
  if (status >= 500) return 'Something went wrong on our end. Please try again.';
  return USER_MESSAGES[ErrorCodes.UNKNOWN];
}

export function getUserMessage(
  code: string | undefined,
  status: number,
  serverMessage?: string,
): string {
  if (code === ErrorCodes.VALIDATION_ERROR && serverMessage) {
    return serverMessage;
  }

  if (code && USER_MESSAGES[code]) {
    return USER_MESSAGES[code];
  }

  return statusFallback(status);
}

export function getKnownUserMessage(code: ErrorCode): string {
  return USER_MESSAGES[code] ?? USER_MESSAGES[ErrorCodes.UNKNOWN];
}
