import dayjs from 'dayjs';
import {
  PACT_MIN_DAYS,
  PACT_PROMISE_MAX_LEN,
  PACT_PROMISE_MIN_LEN,
} from '@/lib/pact/constants';
import { toDateKey } from '@/lib/gamification/streakMath';

/** Inclusive calendar-day span between start and end (same day = 1). */
export function inclusiveDaySpan(startDate: string, endDate: string): number {
  return dayjs(endDate).diff(dayjs(startDate), 'day') + 1;
}

export function earliestEndDate(startDate = toDateKey()): string {
  return dayjs(startDate)
    .add(PACT_MIN_DAYS - 1, 'day')
    .format('YYYY-MM-DD');
}

export function endDateForDuration(startDate: string, inclusiveDays: number): string {
  return dayjs(startDate)
    .add(inclusiveDays - 1, 'day')
    .format('YYYY-MM-DD');
}

export function daysRemaining(endDate: string, today = toDateKey()): number {
  return Math.max(0, dayjs(endDate).diff(dayjs(today), 'day'));
}

export function isPactExpired(endDate: string, today = toDateKey()): boolean {
  return dayjs(today).isAfter(dayjs(endDate), 'day');
}

export function canFulfillPact(
  startDate: string,
  endDate: string,
  today = toDateKey(),
): boolean {
  const t = dayjs(today);
  return !t.isBefore(dayjs(startDate), 'day') && !t.isAfter(dayjs(endDate), 'day');
}

/** Inclusive: date is on or between pact start and end. */
export function isDateInPactRange(
  dateKey: string,
  startDate: string,
  endDate: string,
): boolean {
  const d = dayjs(dateKey);
  return !d.isBefore(dayjs(startDate), 'day') && !d.isAfter(dayjs(endDate), 'day');
}

export type PactValidationError =
  | 'promise_too_short'
  | 'promise_too_long'
  | 'missing_hobby'
  | 'duration_too_short'
  | 'invalid_dates';

export function validatePactDraft(input: {
  hobbyId: string | null | undefined;
  promiseText: string;
  startDate: string;
  endDate: string;
}): PactValidationError | null {
  if (!input.hobbyId) return 'missing_hobby';

  const trimmed = input.promiseText.trim();
  if (trimmed.length < PACT_PROMISE_MIN_LEN) return 'promise_too_short';
  if (trimmed.length > PACT_PROMISE_MAX_LEN) return 'promise_too_long';

  const start = dayjs(input.startDate);
  const end = dayjs(input.endDate);
  if (!start.isValid() || !end.isValid()) return 'invalid_dates';
  if (end.isBefore(start, 'day')) return 'invalid_dates';

  const span = inclusiveDaySpan(input.startDate, input.endDate);
  if (span < PACT_MIN_DAYS) return 'duration_too_short';

  return null;
}

export function pactValidationMessage(error: PactValidationError): string {
  switch (error) {
    case 'missing_hobby':
      return 'Pick a hobby for this pact.';
    case 'promise_too_short':
      return `Promise must be at least ${PACT_PROMISE_MIN_LEN} characters.`;
    case 'promise_too_long':
      return `Promise must be at most ${PACT_PROMISE_MAX_LEN} characters.`;
    case 'duration_too_short':
      return `A pact must last at least ${PACT_MIN_DAYS} days.`;
    case 'invalid_dates':
      return 'Choose a valid end date.';
    default:
      return 'Check your pact details.';
  }
}
