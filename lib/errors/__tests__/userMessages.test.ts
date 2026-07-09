import { ApiError } from '@/lib/errors';
import { getUserMessage } from '@/lib/errors/userMessages';
import { ErrorCodes } from '@/lib/errors/types';

describe('getUserMessage', () => {
  it('maps planner unavailable to a friendly message', () => {
    expect(getUserMessage(ErrorCodes.PLANNER_UNAVAILABLE, 503)).toBe(
      "Couldn't generate your roadmap right now. Please try again in a moment.",
    );
  });

  it('shows validation messages from the server', () => {
    expect(getUserMessage(ErrorCodes.VALIDATION_ERROR, 400, 'Hobby is required')).toBe(
      'Hobby is required',
    );
  });

  it('hides raw internal server messages', () => {
    expect(getUserMessage(undefined, 500, 'ZodError: techniques.0.name Required')).toBe(
      'Something went wrong on our end. Please try again.',
    );
  });
});

describe('ApiError.fromResponse', () => {
  it('never exposes raw 500 messages to the user', () => {
    const error = ApiError.fromResponse(500, {
      error: 'Groq API key invalid: sk-...',
      code: ErrorCodes.INTERNAL_ERROR,
    });

    expect(error.userMessage).not.toContain('Groq');
    expect(error.userMessage).toBe('Something went wrong. Please try again.');
  });
});
