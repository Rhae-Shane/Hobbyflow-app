import {
  canFulfillPact,
  inclusiveDaySpan,
  isDateInPactRange,
  isPactExpired,
  validatePactDraft,
} from '@/lib/pact/pactMath';
import { PACT_BREAK_RATING_PENALTY, PACT_MIN_DAYS } from '@/lib/pact/constants';
import { clampRating, STARTING_RATING } from '@/lib/gamification/constants';

describe('pactMath', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-11T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('requires at least 7 inclusive days and allows long deadlines', () => {
    expect(inclusiveDaySpan('2026-07-11', '2026-07-17')).toBe(7);
    expect(PACT_MIN_DAYS).toBe(7);

    expect(
      validatePactDraft({
        hobbyId: 'h1',
        promiseText: 'Practice guitar every day this week',
        startDate: '2026-07-11',
        endDate: '2026-07-16',
      }),
    ).toBe('duration_too_short');

    expect(
      validatePactDraft({
        hobbyId: 'h1',
        promiseText: 'Practice guitar every day this week',
        startDate: '2026-07-11',
        endDate: '2026-07-17',
      }),
    ).toBeNull();

    expect(
      validatePactDraft({
        hobbyId: 'h1',
        promiseText: 'Make my jump 6 feet by next year',
        startDate: '2026-07-11',
        endDate: '2027-12-31',
      }),
    ).toBeNull();
  });

  it('detects expiry and fulfill window', () => {
    expect(isPactExpired('2026-07-10')).toBe(true);
    expect(isPactExpired('2026-07-11')).toBe(false);
    expect(canFulfillPact('2026-07-01', '2026-07-11')).toBe(true);
    expect(canFulfillPact('2026-07-01', '2026-07-10')).toBe(false);
  });

  it('marks dates inside an active pact range', () => {
    expect(isDateInPactRange('2026-07-11', '2026-07-11', '2026-07-17')).toBe(true);
    expect(isDateInPactRange('2026-07-17', '2026-07-11', '2026-07-17')).toBe(true);
    expect(isDateInPactRange('2026-07-10', '2026-07-11', '2026-07-17')).toBe(false);
    expect(isDateInPactRange('2026-07-18', '2026-07-11', '2026-07-17')).toBe(false);
  });

  it('break penalty lowers rating with floor 699', () => {
    expect(PACT_BREAK_RATING_PENALTY).toBe(15);
    expect(clampRating(720 - PACT_BREAK_RATING_PENALTY)).toBe(705);
    expect(clampRating(STARTING_RATING - PACT_BREAK_RATING_PENALTY)).toBe(STARTING_RATING);
  });
});
