import { getUserMessage } from './userMessages';
import type { ApiErrorBody, ErrorCode } from './types';
import { ErrorCodes } from './types';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly userMessage: string;
  readonly field?: string;
  readonly requestId?: string;

  constructor(
    code: ErrorCode,
    userMessage: string,
    options?: { field?: string; requestId?: string; cause?: unknown },
  ) {
    super(userMessage);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.field = options?.field;
    this.requestId = options?.requestId;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export class ApiError extends AppError {
  readonly status: number;

  constructor(
    status: number,
    code: ErrorCode,
    userMessage: string,
    options?: { field?: string; requestId?: string; cause?: unknown },
  ) {
    super(code, userMessage, options);
    this.name = 'ApiError';
    this.status = status;
  }

  static fromResponse(status: number, body: ApiErrorBody): ApiError {
    const code = (body.code as ErrorCode | undefined) ?? ErrorCodes.UNKNOWN;
    const userMessage = getUserMessage(body.code, status, body.error);
    return new ApiError(status, code, userMessage, {
      field: body.field,
      requestId: body.requestId,
    });
  }
}

export function toUserMessage(error: unknown, fallback = getUserMessage(undefined, 500)): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return fallback;
  }
  return fallback;
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
