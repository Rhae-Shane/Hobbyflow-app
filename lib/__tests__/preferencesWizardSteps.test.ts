import {
  EMPTY_PREFERENCES,
  getPreferencesResumeStepIndex,
  WIZARD_STEPS,
} from '@/lib/preferencesWizardSteps';
import { appendUniqueCustom, type UserPreferences } from '@/types/preferences.types';

describe('getPreferencesResumeStepIndex', () => {
  const completePreferences: UserPreferences = {
    ...EMPTY_PREFERENCES,
    userRole: 'Working professional',
    ageRange: '25–34',
    topGoals: ['Pick up a brand-new hobby'],
    accessibilityNeeds: ['None — no adjustments needed'],
    learningStrengths: ['Learn well by doing'],
    practiceEnvironments: ['At home only'],
    resourceBudget: 'Low budget',
    learningStyles: ['Video'],
  };

  it('returns 0 when preferences are null', () => {
    expect(getPreferencesResumeStepIndex(null)).toBe(0);
  });

  it('returns roles step when userRole is empty', () => {
    expect(getPreferencesResumeStepIndex(EMPTY_PREFERENCES)).toBe(0);
  });

  it('returns age step when only role is saved', () => {
    const partial = { ...EMPTY_PREFERENCES, userRole: 'Student' };
    expect(getPreferencesResumeStepIndex(partial)).toBe(1);
  });

  it('returns goals step when role and age are saved', () => {
    const partial = {
      ...EMPTY_PREFERENCES,
      userRole: 'Student',
      ageRange: '18–24',
    };
    expect(getPreferencesResumeStepIndex(partial)).toBe(2);
  });

  it('returns accessibility step when role, age, and goals are saved', () => {
    const partial = {
      ...EMPTY_PREFERENCES,
      userRole: 'Student',
      ageRange: '18–24',
      topGoals: ['Relax and de-stress'],
    };
    expect(getPreferencesResumeStepIndex(partial)).toBe(4);
  });

  it('returns practice environment step when legacy profile only has old fields', () => {
    const legacyPartial = {
      ...EMPTY_PREFERENCES,
      userRole: 'Student',
      ageRange: '18–24',
      topGoals: ['Relax and de-stress'],
      accessibilityNeeds: ['None — no adjustments needed'],
      learningStyles: ['Video'],
    };
    expect(getPreferencesResumeStepIndex(legacyPartial)).toBe(6);
  });

  it('returns last step when all required fields are saved', () => {
    expect(getPreferencesResumeStepIndex(completePreferences)).toBe(WIZARD_STEPS.length - 1);
  });
});

describe('appendUniqueCustom', () => {
  it('appends trimmed custom value when not a duplicate', () => {
    expect(appendUniqueCustom(['Video'], '  Audio  ')).toEqual(['Video', 'Audio']);
  });

  it('ignores case-insensitive duplicates', () => {
    expect(appendUniqueCustom(['Video'], 'video')).toEqual(['Video']);
  });

  it('returns original array for blank input', () => {
    expect(appendUniqueCustom(['Video'], '   ')).toEqual(['Video']);
  });
});
