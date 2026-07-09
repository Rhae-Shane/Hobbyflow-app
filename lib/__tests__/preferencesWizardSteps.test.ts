import {
  EMPTY_PREFERENCES,
  getPreferencesResumeStepIndex,
  WIZARD_STEPS,
} from '@/lib/preferencesWizardSteps';
import { appendUniqueCustom, type UserPreferences } from '@/types/preferences.types';

describe('getPreferencesResumeStepIndex', () => {
  const completePreferences: UserPreferences = {
    ...EMPTY_PREFERENCES,
    userRoles: ['Developer/Engineer'],
    topGoals: ['Build new skills'],
    learningStyles: ['Bite-sized lessons'],
    selectedTags: ['AI'],
    dailyGoal: '10',
  };

  it('returns 0 when preferences are null', () => {
    expect(getPreferencesResumeStepIndex(null)).toBe(0);
  });

  it('returns roles step when userRoles is empty', () => {
    expect(getPreferencesResumeStepIndex(EMPTY_PREFERENCES)).toBe(0);
  });

  it('returns goals step when only roles are saved', () => {
    const partial = { ...EMPTY_PREFERENCES, userRoles: ['Student'] };
    expect(getPreferencesResumeStepIndex(partial)).toBe(1);
  });

  it('returns learning-styles step when roles and goals are saved', () => {
    const partial = {
      ...EMPTY_PREFERENCES,
      userRoles: ['Student'],
      topGoals: ['Just for fun'],
    };
    expect(getPreferencesResumeStepIndex(partial)).toBe(3);
  });

  it('returns topics step when learning styles are saved', () => {
    const partial = {
      ...EMPTY_PREFERENCES,
      userRoles: ['Student'],
      topGoals: ['Just for fun'],
      learningStyles: ['Visual explanations'],
    };
    expect(getPreferencesResumeStepIndex(partial)).toBe(5);
  });

  it('returns daily-goal step when all multi-select fields are saved', () => {
    const partial = {
      ...EMPTY_PREFERENCES,
      userRoles: ['Student'],
      topGoals: ['Just for fun'],
      learningStyles: ['Visual explanations'],
      selectedTags: ['Psychology'],
    };
    expect(getPreferencesResumeStepIndex(partial)).toBe(8);
  });

  it('returns last step when all fields are complete', () => {
    expect(getPreferencesResumeStepIndex(completePreferences)).toBe(WIZARD_STEPS.length - 1);
  });
});

describe('appendUniqueCustom', () => {
  it('appends trimmed custom value when not a duplicate', () => {
    expect(appendUniqueCustom(['AI'], '  Chess  ')).toEqual(['AI', 'Chess']);
  });

  it('ignores case-insensitive duplicates', () => {
    expect(appendUniqueCustom(['AI'], 'ai')).toEqual(['AI']);
  });

  it('returns original array for blank input', () => {
    expect(appendUniqueCustom(['AI'], '   ')).toEqual(['AI']);
  });
});
