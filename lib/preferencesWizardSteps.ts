import {
  ACCESSIBILITY_NEEDS,
  AGE_RANGES,
  DEFAULT_CONTENT_LANGUAGE,
  LEARNING_STRENGTHS,
  LEARNING_STYLES,
  PRACTICE_ENVIRONMENTS,
  RESOURCE_BUDGETS,
  TOP_GOALS,
  USER_ROLES,
} from '@/constants/preferences';
import type { ChipLayout } from '@/components/onboarding/MultiSelectChips';
import type { UserPreferences } from '@/types/preferences.types';

export type StepKind = 'data' | 'interstitial' | 'summary' | 'single';

export type PreferenceDataKey = keyof Pick<
  UserPreferences,
  | 'topGoals'
  | 'accessibilityNeeds'
  | 'learningStrengths'
  | 'practiceEnvironments'
  | 'learningStyles'
>;

export type PreferenceSingleKey = keyof Pick<
  UserPreferences,
  'userRole' | 'ageRange' | 'resourceBudget'
>;

/** Open Doodles–style keys used on interstitial steps (see categoryIllustrations). */
export type OnboardingIllustrationKey = 'plant' | 'reading' | 'sitting' | 'meditating';

export type WizardStep = {
  id: string;
  kind: StepKind;
  title: string;
  subtitle?: string;
  dataKey?: PreferenceDataKey;
  singleKey?: PreferenceSingleKey;
  minSelection?: number;
  chipLayout?: ChipLayout;
  /** Line-art doodle for interstitial / summary moments (no emoji). */
  illustration?: OnboardingIllustrationKey;
  otherPlaceholder?: string;
  showOtherAddButton?: boolean;
  allowOther?: boolean;
};

export const PREFERENCE_FIELD_OPTIONS: Record<PreferenceDataKey, readonly string[]> = {
  topGoals: TOP_GOALS,
  accessibilityNeeds: ACCESSIBILITY_NEEDS,
  learningStrengths: LEARNING_STRENGTHS,
  practiceEnvironments: PRACTICE_ENVIRONMENTS,
  learningStyles: LEARNING_STYLES,
};

export const PREFERENCE_SINGLE_OPTIONS: Record<PreferenceSingleKey, readonly string[]> = {
  userRole: USER_ROLES,
  ageRange: AGE_RANGES,
  resourceBudget: RESOURCE_BUDGETS,
};

export const EMPTY_PREFERENCES: UserPreferences = {
  topGoals: [],
  userRole: '',
  ageRange: '',
  accessibilityNeeds: [],
  learningStrengths: [],
  practiceEnvironments: [],
  resourceBudget: '',
  learningStyles: [],
  contentLanguage: DEFAULT_CONTENT_LANGUAGE,
};

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'roles',
    kind: 'single',
    title: 'What best describes your day-to-day?',
    subtitle: 'Pick one',
    singleKey: 'userRole',
    allowOther: true,
    otherPlaceholder: 'Other role (optional)',
  },
  {
    id: 'age',
    kind: 'single',
    title: 'What is your age range?',
    subtitle: 'Helps us tailor examples and pacing',
    singleKey: 'ageRange',
  },
  {
    id: 'goals',
    kind: 'data',
    title: 'What do you want from your hobbies?',
    subtitle: 'Select all that apply',
    dataKey: 'topGoals',
    minSelection: 1,
    chipLayout: 'list',
    allowOther: true,
    otherPlaceholder: 'Other goals (optional)',
    showOtherAddButton: true,
  },
  {
    id: 'interstitial-time',
    kind: 'interstitial',
    title: "Great! We'll help you practice what you thought you didn't have time for",
    subtitle: 'Finally pick up the hobbies you have always wanted to try.',
    illustration: 'plant',
  },
  {
    id: 'accessibility',
    kind: 'data',
    title: 'Anything we should know about how you learn?',
    subtitle: 'Select all that apply — we use this to adapt your roadmaps',
    dataKey: 'accessibilityNeeds',
    minSelection: 1,
    chipLayout: 'list',
    otherPlaceholder: 'Other needs (optional)',
    showOtherAddButton: true,
  },
  {
    id: 'strengths',
    kind: 'data',
    title: 'Any strengths that make your learning unique?',
    subtitle: 'Optional — select any that fit you',
    dataKey: 'learningStrengths',
    minSelection: 0,
    chipLayout: 'wrap',
    otherPlaceholder: 'Other strengths (optional)',
    showOtherAddButton: true,
  },
  {
    id: 'practice-environment',
    kind: 'data',
    title: 'Where will you usually practice?',
    subtitle: 'Select all that apply',
    dataKey: 'practiceEnvironments',
    minSelection: 1,
    chipLayout: 'list',
    otherPlaceholder: 'Other constraints (optional)',
    showOtherAddButton: true,
  },
  {
    id: 'resource-budget',
    kind: 'single',
    title: 'What is your resource budget?',
    subtitle: 'Helps us suggest realistic gear and materials',
    singleKey: 'resourceBudget',
  },
  {
    id: 'learning-styles',
    kind: 'data',
    title: 'How do you prefer to learn?',
    subtitle: 'Select all that apply',
    dataKey: 'learningStyles',
    minSelection: 1,
    chipLayout: 'grid',
  },
  {
    id: 'interstitial-noted',
    kind: 'summary',
    title: 'Noted!',
    subtitle: "We'll build roadmaps that fit you",
    illustration: 'sitting',
  },
  {
    id: 'interstitial-personalized',
    kind: 'interstitial',
    title: 'Personalized learning for you',
    subtitle:
      'We will adapt techniques to your needs, environment, budget, and preferred formats.\n\nYou can update this later in the settings.',
    illustration: 'reading',
  },
];

function isDataFieldComplete(
  preferences: UserPreferences,
  dataKey: PreferenceDataKey,
  minSelection: number,
): boolean {
  return preferences[dataKey].length >= minSelection;
}

/** First wizard step to resume from partial cloud save (skips completed data/single steps). */
export function getPreferencesResumeStepIndex(
  preferences: UserPreferences | null,
  steps: readonly WizardStep[] = WIZARD_STEPS,
): number {
  if (!preferences) return 0;

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];

    if (step.kind === 'data' && step.dataKey) {
      const minSelection = step.minSelection ?? 1;
      if (!isDataFieldComplete(preferences, step.dataKey, minSelection)) {
        return index;
      }
    }

    if (step.kind === 'single' && step.singleKey && !preferences[step.singleKey]?.trim()) {
      return index;
    }
  }

  return steps.length - 1;
}

export function getOptionsForDataKey(dataKey: PreferenceDataKey): readonly string[] {
  return PREFERENCE_FIELD_OPTIONS[dataKey];
}

export function getOptionsForSingleKey(singleKey: PreferenceSingleKey): readonly string[] {
  return PREFERENCE_SINGLE_OPTIONS[singleKey];
}

export function isPresetSingleValue(singleKey: PreferenceSingleKey, value: string): boolean {
  return PREFERENCE_SINGLE_OPTIONS[singleKey].includes(
    value as (typeof PREFERENCE_SINGLE_OPTIONS)[typeof singleKey][number],
  );
}
