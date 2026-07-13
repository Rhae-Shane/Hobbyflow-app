/** Onboarding option catalogs — hobby-learning focused, with AI hints for planner prompts. */

export const TOP_GOALS = [
  'Pick up a brand-new hobby',
  'Get back into a hobby I paused',
  'Level up skills I already have',
  'Make better use of spare time',
  'Relax and de-stress',
  'Connect with others through hobbies',
  'Build a creative outlet',
  'Compete or perform',
] as const;

export const USER_ROLES = [
  'Working professional',
  'Student',
  'Parent / caregiver',
  'Creative professional',
  'Retired or semi-retired',
  'Freelancer / self-employed',
  'Shift worker',
] as const;

export const AGE_RANGES = [
  'Under 18',
  '18–24',
  '25–34',
  '35–44',
  '45–54',
  '55–64',
  '65+',
  'Prefer not to say',
] as const;

/** Accessibility / disability-related needs — pick all that apply. */
export const ACCESSIBILITY_NEEDS = [
  'None — no adjustments needed',
  'Vision impairment / low vision',
  'Blindness',
  'Hearing impairment / deafness',
  'Motor or dexterity limitations',
  'Chronic pain or fatigue',
  'ADHD / attention differences',
  'Autism / sensory sensitivity',
  'Dyslexia / reading differences',
  'Anxiety in high-pressure practice',
  'Prefer not to say',
] as const;

/** Mutually exclusive with other accessibility selections. */
export const ACCESSIBILITY_EXCLUSIVE_OPTIONS = [
  'None — no adjustments needed',
  'Prefer not to say',
] as const;

/** Strengths or unique learning traits — optional, helps tailor roadmaps. */
export const LEARNING_STRENGTHS = [
  'Strong visual memory',
  'Learn well by listening',
  'Learn well by doing',
  'Good at breaking down steps',
  'High stamina for practice',
  'Strong focus for long sessions',
  'Creative problem-solving',
  'Good with patterns and systems',
] as const;

export const PRACTICE_ENVIRONMENTS = [
  'At home only',
  'Small space / apartment',
  'Need quiet practice',
  'Can practice outdoors',
  'Travel often',
  'Share space with others',
] as const;

export const RESOURCE_BUDGETS = [
  'Free resources only',
  'Low budget',
  'Moderate budget',
  'Will invest in gear or courses',
] as const;

/** Preferred content formats — hobby/time are collected per hobby during setup. */
export const LEARNING_STYLES = ['Video', 'Audio', 'Text', 'Daily tasks'] as const;

export const LEARNING_STYLE_SUPPORT = {
  currentlySupports: ['Video', 'Audio', 'Text', 'Daily tasks'],
  workingOn: [] as const,
  alsoSupports: [] as const,
} as const;

export const DEFAULT_CONTENT_LANGUAGE = 'en';

export const TOP_GOALS_AI_HINTS: Record<(typeof TOP_GOALS)[number], string> = {
  'Pick up a brand-new hobby': 'fundamentals, early wins',
  'Get back into a hobby I paused': 'gentle ramp-up after rust',
  'Level up skills I already have': 'refine gaps, next-level',
  'Make better use of spare time': 'short, high-value sessions',
  'Relax and de-stress': 'low-stakes, enjoyable practice',
  'Connect with others through hobbies': 'social play when relevant',
  'Build a creative outlet': 'expressive projects to share',
  'Compete or perform': 'performance-ready, measurable progress',
};

export const USER_ROLES_AI_HINTS: Record<(typeof USER_ROLES)[number], string> = {
  'Working professional': 'limited weekday time',
  Student: 'busy, learning-oriented',
  'Parent / caregiver': 'short, interruptible home practice',
  'Creative professional': 'craft / creative process',
  'Retired or semi-retired': 'more time for depth',
  'Freelancer / self-employed': 'modular, irregular schedule',
  'Shift worker': 'short, repeatable drills',
};

export const AGE_RANGES_AI_HINTS: Record<(typeof AGE_RANGES)[number], string> = {
  'Under 18': 'age-appropriate',
  '18–24': 'digital-fluent, experimental OK',
  '25–34': 'busy adult life',
  '35–44': 'efficient, routine-friendly',
  '45–54': 'rebuild fundamentals patiently',
  '55–64': 'clear step-by-step',
  '65+': 'clear pacing, low friction',
  'Prefer not to say': 'age-neutral',
};

export const ACCESSIBILITY_NEEDS_AI_HINTS: Record<(typeof ACCESSIBILITY_NEEDS)[number], string> = {
  'None — no adjustments needed': 'no a11y adjustments',
  'Vision impairment / low vision': 'high-contrast, audio alt, large demos',
  Blindness: 'audio/tactile only; no visual-only',
  'Hearing impairment / deafness': 'captioned video/text; no audio-only',
  'Motor or dexterity limitations': 'low-dexterity / adaptive options',
  'Chronic pain or fatigue': 'short sessions, allow breaks',
  'ADHD / attention differences': 'short tasks, clear structure',
  'Autism / sensory sensitivity': 'predictable, calm pacing',
  'Dyslexia / reading differences': 'prefer video/audio; chunked text',
  'Anxiety in high-pressure practice': 'low-stakes practice',
  'Prefer not to say': 'keep flexible',
};

export const LEARNING_STRENGTHS_AI_HINTS: Record<(typeof LEARNING_STRENGTHS)[number], string> = {
  'Strong visual memory': 'diagrams, demos',
  'Learn well by listening': 'audio explainers',
  'Learn well by doing': 'hands-on drills',
  'Good at breaking down steps': 'structured milestones',
  'High stamina for practice': 'longer sessions OK',
  'Strong focus for long sessions': 'multi-part sessions OK',
  'Creative problem-solving': 'open-ended challenges',
  'Good with patterns and systems': 'frameworks, pattern drills',
};

export const PRACTICE_ENVIRONMENTS_AI_HINTS: Record<(typeof PRACTICE_ENVIRONMENTS)[number], string> = {
  'At home only': 'no studio/venue required',
  'Small space / apartment': 'compact, low-noise setups',
  'Need quiet practice': 'silent / low-noise only',
  'Can practice outdoors': 'outdoor OK',
  'Travel often': 'portable, minimal gear',
  'Share space with others': 'discreet, non-disruptive',
};

export const RESOURCE_BUDGETS_AI_HINTS: Record<(typeof RESOURCE_BUDGETS)[number], string> = {
  'Free resources only': 'free only; no paid gear',
  'Low budget': 'low-cost / household items',
  'Moderate budget': 'basic starter gear OK',
  'Will invest in gear or courses': 'paid tools OK when helpful',
};

export const LEARNING_STYLES_AI_HINTS: Record<(typeof LEARNING_STYLES)[number], string> = {
  Video: 'video demos',
  Audio: 'podcasts / guided audio',
  Text: 'articles / written guides',
  'Daily tasks': 'small daily actions',
};

type SavedPreferences = {
  topGoals: string[];
  userRole: string;
  ageRange: string;
  accessibilityNeeds: string[];
  learningStrengths: string[];
  practiceEnvironments: string[];
  resourceBudget: string;
  learningStyles: string[];
};

function compactItems(selections: string[], hints: Record<string, string>): string {
  return selections
    .map((label) => {
      const hint = hints[label];
      return hint ? `${label} (${hint})` : label;
    })
    .join('; ');
}

function buildAccessibilityOverrides(preferences: SavedPreferences): string[] {
  const overrides: string[] = [];
  const accessibilityNeeds = new Set(preferences.accessibilityNeeds);
  const learningStyles = new Set(preferences.learningStyles);

  if (accessibilityNeeds.has('Blindness') && learningStyles.has('Video')) {
    overrides.push('Override: Blindness > video — do not assign video.');
  }

  if (accessibilityNeeds.has('Hearing impairment / deafness') && learningStyles.has('Audio')) {
    overrides.push('Override: Hearing impairment > audio — do not assign audio.');
  }

  return overrides;
}

/**
 * Compact plain-text block for AI planner / chat prompts.
 * Accessibility labels stay as `- Label:` lines so server parsers still match.
 */
export function buildPreferencesAiContext(preferences: SavedPreferences): string {
  const lines: string[] = [];

  if (preferences.userRole) {
    const hint = USER_ROLES_AI_HINTS[preferences.userRole as (typeof USER_ROLES)[number]];
    lines.push(`Role: ${preferences.userRole}${hint ? ` — ${hint}` : ''}`);
  }

  if (preferences.ageRange) {
    const hint = AGE_RANGES_AI_HINTS[preferences.ageRange as (typeof AGE_RANGES)[number]];
    lines.push(`Age: ${preferences.ageRange}${hint ? ` — ${hint}` : ''}`);
  }

  if (preferences.topGoals.length > 0) {
    lines.push(`Goals: ${compactItems(preferences.topGoals, TOP_GOALS_AI_HINTS)}`);
  }

  if (preferences.accessibilityNeeds.length > 0) {
    lines.push('Accessibility:');
    for (const label of preferences.accessibilityNeeds) {
      const hint = ACCESSIBILITY_NEEDS_AI_HINTS[label as (typeof ACCESSIBILITY_NEEDS)[number]];
      lines.push(hint ? `- ${label}: ${hint}` : `- ${label}`);
    }
  }

  if (preferences.learningStrengths.length > 0) {
    lines.push(`Strengths: ${compactItems(preferences.learningStrengths, LEARNING_STRENGTHS_AI_HINTS)}`);
  }

  if (preferences.practiceEnvironments.length > 0) {
    lines.push(
      `Environment: ${compactItems(preferences.practiceEnvironments, PRACTICE_ENVIRONMENTS_AI_HINTS)}`,
    );
  }

  if (preferences.resourceBudget) {
    const hint =
      RESOURCE_BUDGETS_AI_HINTS[preferences.resourceBudget as (typeof RESOURCE_BUDGETS)[number]];
    lines.push(`Budget: ${preferences.resourceBudget}${hint ? ` — ${hint}` : ''}`);
  }

  if (preferences.learningStyles.length > 0) {
    lines.push(`Formats: ${compactItems(preferences.learningStyles, LEARNING_STYLES_AI_HINTS)}`);
  }

  lines.push(...buildAccessibilityOverrides(preferences));

  return lines.join('\n');
}

export function normalizeAccessibilitySelection(
  selected: string[],
  toggled: string,
): string[] {
  if (ACCESSIBILITY_EXCLUSIVE_OPTIONS.includes(toggled as (typeof ACCESSIBILITY_EXCLUSIVE_OPTIONS)[number])) {
    return selected.includes(toggled) ? [] : [toggled];
  }

  const withoutExclusive = selected.filter(
    (item) =>
      !ACCESSIBILITY_EXCLUSIVE_OPTIONS.includes(
        item as (typeof ACCESSIBILITY_EXCLUSIVE_OPTIONS)[number],
      ),
  );

  if (selected.includes(toggled)) {
    return withoutExclusive.filter((item) => item !== toggled);
  }

  return [...withoutExclusive, toggled];
}
