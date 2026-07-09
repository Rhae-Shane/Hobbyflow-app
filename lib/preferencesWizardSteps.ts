import {
  DAILY_GOAL_OPTIONS,
  DEFAULT_CONTENT_LANGUAGE,
  LEARNING_STYLES,
  TOP_GOALS,
  TOPIC_TAGS,
  USER_ROLES,
} from '@/constants/preferences';
import type { ChipLayout } from '@/components/onboarding/MultiSelectChips';
import type { UserPreferences } from '@/types/preferences.types';

export type StepKind = 'data' | 'interstitial' | 'summary' | 'daily';

export type PreferenceDataKey = keyof Pick<
  UserPreferences,
  'userRoles' | 'topGoals' | 'learningStyles' | 'selectedTags'
>;

export type WizardStep = {
  id: string;
  kind: StepKind;
  title: string;
  subtitle?: string;
  dataKey?: PreferenceDataKey;
  minSelection?: number;
  chipLayout?: ChipLayout;
  emoji?: string;
  otherPlaceholder?: string;
  showOtherAddButton?: boolean;
};

export const PREFERENCE_FIELD_OPTIONS: Record<PreferenceDataKey, readonly string[]> = {
  userRoles: USER_ROLES,
  topGoals: TOP_GOALS,
  learningStyles: LEARNING_STYLES,
  selectedTags: TOPIC_TAGS,
};

export const EMPTY_PREFERENCES: UserPreferences = {
  topGoals: [],
  selectedTags: [],
  userRoles: [],
  learningStyles: [],
  dailyGoal: '',
  contentLanguage: DEFAULT_CONTENT_LANGUAGE,
};

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'roles',
    kind: 'data',
    title: 'What types of work do you do?',
    subtitle: 'Select all that apply',
    dataKey: 'userRoles',
    minSelection: 1,
    chipLayout: 'list',
  },
  {
    id: 'goals',
    kind: 'data',
    title: 'What do you want to achieve?',
    subtitle: 'Select all that apply',
    dataKey: 'topGoals',
    minSelection: 1,
    chipLayout: 'list',
  },
  {
    id: 'interstitial-time',
    kind: 'interstitial',
    title: "Great! We'll help you learn what you thought you didn't have time for",
    subtitle: "Finally learn the things you've always wanted to learn!",
    emoji: '🔺',
  },
  {
    id: 'learning-styles',
    kind: 'data',
    title: 'What matters to you when learning?',
    subtitle: 'Select all that apply',
    dataKey: 'learningStyles',
    minSelection: 1,
    chipLayout: 'grid',
    showOtherAddButton: true,
  },
  {
    id: 'interstitial-noted',
    kind: 'summary',
    title: 'Noted!',
    subtitle: "We'll try to satisfy all your learning needs",
  },
  {
    id: 'topics',
    kind: 'data',
    title: 'What topics interest you?',
    subtitle: "Don't worry, the choice won't limit your experience",
    dataKey: 'selectedTags',
    minSelection: 1,
    chipLayout: 'wrap',
    otherPlaceholder: 'Other topics (optional)',
    showOtherAddButton: true,
  },
  {
    id: 'interstitial-topics',
    kind: 'interstitial',
    title: "Perfect choice! We'll use this to find the best roadmaps for you",
    subtitle: 'You can also create your own hobby roadmap for any topic you want to learn',
    emoji: '👍',
  },
  {
    id: 'interstitial-personalized',
    kind: 'interstitial',
    title: 'Personalized learning for you',
    subtitle:
      'We will use examples that are relevant to your role and expertise when helpful.\n\nYou can update this later in the settings.',
    emoji: '🐦',
  },
  {
    id: 'daily-goal',
    kind: 'daily',
    title: 'How long do you want to learn every day?',
  },
  {
    id: 'interstitial-motivation',
    kind: 'interstitial',
    title: '',
    subtitle: '',
    emoji: '🎯',
  },
];

export { DAILY_GOAL_OPTIONS };

function isDataFieldComplete(preferences: UserPreferences, dataKey: PreferenceDataKey): boolean {
  return preferences[dataKey].length > 0;
}

/** First wizard step to resume from partial cloud save (skips completed data/daily steps). */
export function getPreferencesResumeStepIndex(
  preferences: UserPreferences | null,
  steps: readonly WizardStep[] = WIZARD_STEPS,
): number {
  if (!preferences) return 0;

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];

    if (step.kind === 'data' && step.dataKey && !isDataFieldComplete(preferences, step.dataKey)) {
      return index;
    }

    if (step.kind === 'daily' && !preferences.dailyGoal) {
      return index;
    }
  }

  return steps.length - 1;
}

export function getOptionsForDataKey(dataKey: PreferenceDataKey): readonly string[] {
  return PREFERENCE_FIELD_OPTIONS[dataKey];
}
