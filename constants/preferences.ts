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
  currentlySupports: ['Video', 'Text'],
  workingOn: ['Daily tasks'],
  alsoSupports: ['Audio'],
} as const;

export const DEFAULT_CONTENT_LANGUAGE = 'en';

export const TOP_GOALS_AI_HINTS: Record<(typeof TOP_GOALS)[number], string> = {
  'Pick up a brand-new hobby':
    'User is exploring; prioritize fundamentals, low barrier to entry, and early wins.',
  'Get back into a hobby I paused':
    'User is returning after a break; acknowledge rust and use a gentle ramp-up.',
  'Level up skills I already have':
    'User has baseline skills; focus on refinement, gaps, and next-level techniques.',
  'Make better use of spare time':
    'User wants efficient sessions; favor concise, high-value techniques.',
  'Relax and de-stress':
    'Keep pressure low; favor enjoyable, low-stakes practice over grind.',
  'Connect with others through hobbies':
    'Where relevant, mention social play, clubs, jam sessions, or shared practice.',
  'Build a creative outlet':
    'Emphasize expressive output and projects the user can show or share.',
  'Compete or perform':
    'Prioritize performance-ready skills, consistency under pressure, and measurable improvement.',
};

export const USER_ROLES_AI_HINTS: Record<(typeof USER_ROLES)[number], string> = {
  'Working professional': 'Limited weekday time; use practical, after-work friendly examples.',
  Student: 'Flexible but busy schedule; learning-oriented framing works well.',
  'Parent / caregiver': 'Very short windows; favor home-friendly, interruptible practice.',
  'Creative professional': 'Connect techniques to aesthetics, craft, and creative process.',
  'Retired or semi-retired': 'More time available; depth and thorough practice are welcome.',
  'Freelancer / self-employed': 'Irregular schedule; modular sessions that stand alone.',
  'Shift worker': 'Variable availability; favor short, repeatable drills.',
};

export const AGE_RANGES_AI_HINTS: Record<(typeof AGE_RANGES)[number], string> = {
  'Under 18': 'Use age-appropriate examples and simpler language where helpful.',
  '18–24': 'Examples can assume digital fluency and flexible experimentation.',
  '25–34': 'Balance practical progress with busy adult life constraints.',
  '35–44': 'Favor efficient techniques that fit established routines.',
  '45–54': 'Allow time to rebuild fundamentals; avoid assuming prior exposure.',
  '55–64': 'Be patient with new tools; clear step-by-step guidance helps.',
  '65+': 'Prioritize clarity, pacing, and low-friction practice setups.',
  'Prefer not to say': 'Do not infer age; keep examples neutral and inclusive.',
};

export const ACCESSIBILITY_NEEDS_AI_HINTS: Record<(typeof ACCESSIBILITY_NEEDS)[number], string> = {
  'None — no adjustments needed': 'No accessibility adjustments requested.',
  'Vision impairment / low vision':
    'Favor high-contrast text resources, audio alternatives, and large-visual demos.',
  Blindness:
    'Prioritize audio, tactile, and descriptive non-visual instructions; avoid visual-only steps.',
  'Hearing impairment / deafness':
    'Favor captioned video, text guides, and visual demos; avoid audio-only techniques.',
  'Motor or dexterity limitations':
    'Suggest low-dexterity alternatives, adaptive tools, and shorter physical drills.',
  'Chronic pain or fatigue':
    'Keep sessions short, allow breaks, and avoid high-intensity repetitive drills.',
  'ADHD / attention differences':
    'Use shorter tasks, clear structure, and frequent checkpoints; reduce overwhelm.',
  'Autism / sensory sensitivity':
    'Avoid overstimulating formats; offer predictable steps and calm pacing.',
  'Dyslexia / reading differences':
    'Minimize long reading; prefer video, audio, and chunked text with clear headings.',
  'Anxiety in high-pressure practice':
    'Keep practice low-stakes; avoid competitive framing unless the user wants it.',
  'Prefer not to say': 'Do not assume accessibility needs; keep recommendations flexible.',
};

export const LEARNING_STRENGTHS_AI_HINTS: Record<(typeof LEARNING_STRENGTHS)[number], string> = {
  'Strong visual memory': 'Lean on diagrams, demos, and visual pattern drills.',
  'Learn well by listening': 'Prioritize audio explainers and verbal walkthroughs.',
  'Learn well by doing': 'Prioritize hands-on drills and immediate practice reps.',
  'Good at breaking down steps': 'Offer structured milestones the user can decompose further.',
  'High stamina for practice': 'Can handle longer sessions and deeper technique stacks.',
  'Strong focus for long sessions': 'Multi-part sessions and longer projects are acceptable.',
  'Creative problem-solving': 'Include open-ended challenges and creative variations.',
  'Good with patterns and systems': 'Use frameworks, repeatable systems, and pattern drills.',
};

export const PRACTICE_ENVIRONMENTS_AI_HINTS: Record<(typeof PRACTICE_ENVIRONMENTS)[number], string> = {
  'At home only':
    'Avoid techniques that require studios, travel, or specialized venues.',
  'Small space / apartment':
    'Favor compact setups; avoid large equipment or noisy drills.',
  'Need quiet practice':
    'Avoid loud techniques; prefer silent or low-noise exercises.',
  'Can practice outdoors':
    'Outdoor-friendly drills and location-flexible practice are OK.',
  'Travel often':
    'Prefer portable, minimal-equipment techniques that work on the go.',
  'Share space with others':
    'Keep practice discreet; avoid disruptive or space-hogging activities.',
};

export const RESOURCE_BUDGETS_AI_HINTS: Record<(typeof RESOURCE_BUDGETS)[number], string> = {
  'Free resources only':
    'Use free videos, articles, and open tools only; avoid paid gear or subscriptions in search_query.',
  'Low budget':
    'Prefer low-cost or household items; mention affordable starter options.',
  'Moderate budget':
    'Basic starter gear is OK; avoid premium or professional-only equipment.',
  'Will invest in gear or courses':
    'Paid tools, courses, and quality gear recommendations are acceptable when helpful.',
};

export const LEARNING_STYLES_AI_HINTS: Record<(typeof LEARNING_STYLES)[number], string> = {
  Video: 'Prefer video-led techniques with demos the user can follow along.',
  Audio: 'Prefer listen-and-practice content such as podcasts or guided audio drills.',
  Text: 'Prefer articles, guides, and written walkthroughs.',
  'Daily tasks': 'Prefer small actionable daily tasks over long passive sessions.',
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

function singleHintLine(
  label: string,
  hints: Record<string, string>,
  sectionTitle: string,
): string[] {
  if (!label) return [];
  const hint = hints[label];
  return [`${sectionTitle}:`, hint ? `- ${label}: ${hint}` : `- ${label}`];
}

function hintLines(
  selections: string[],
  hints: Record<string, string>,
  sectionTitle: string,
): string[] {
  if (selections.length === 0) return [];

  const lines = selections.map((label) => {
    const hint = hints[label];
    return hint ? `- ${label}: ${hint}` : `- ${label}`;
  });

  return [`${sectionTitle}:`, ...lines];
}

function buildAccessibilityOverrides(preferences: SavedPreferences): string[] {
  const overrides: string[] = [];
  const accessibilityNeeds = new Set(preferences.accessibilityNeeds);
  const learningStyles = new Set(preferences.learningStyles);

  if (accessibilityNeeds.has('Blindness') && learningStyles.has('Video')) {
    overrides.push(
      'Accessibility override: Blindness takes priority over video preference — do not assign video modality.',
    );
  }

  if (accessibilityNeeds.has('Hearing impairment / deafness') && learningStyles.has('Audio')) {
    overrides.push(
      'Accessibility override: Hearing impairment takes priority over audio preference — do not assign audio modality.',
    );
  }

  return overrides;
}

/** Plain-text block for AI planner / chat prompts from saved user preferences. */
export function buildPreferencesAiContext(preferences: SavedPreferences): string {
  const ageHint = preferences.ageRange
    ? AGE_RANGES_AI_HINTS[preferences.ageRange as (typeof AGE_RANGES)[number]]
    : undefined;
  const ageLine = preferences.ageRange
    ? `Age range: ${preferences.ageRange}${ageHint ? ` (${ageHint})` : ''}`
    : '';

  const resourceHint = preferences.resourceBudget
    ? RESOURCE_BUDGETS_AI_HINTS[preferences.resourceBudget as (typeof RESOURCE_BUDGETS)[number]]
    : undefined;
  const resourceLine = preferences.resourceBudget
    ? `Resource budget: ${preferences.resourceBudget}${resourceHint ? ` (${resourceHint})` : ''}`
    : '';

  const sections = [
    ...singleHintLine(preferences.userRole, USER_ROLES_AI_HINTS, 'Learner context'),
    ageLine,
    ...hintLines(preferences.topGoals, TOP_GOALS_AI_HINTS, 'Hobby goals'),
    ...hintLines(
      preferences.accessibilityNeeds,
      ACCESSIBILITY_NEEDS_AI_HINTS,
      'Accessibility and learning needs',
    ),
    ...hintLines(
      preferences.learningStrengths,
      LEARNING_STRENGTHS_AI_HINTS,
      'Learning strengths',
    ),
    ...hintLines(
      preferences.practiceEnvironments,
      PRACTICE_ENVIRONMENTS_AI_HINTS,
      'Practice environment',
    ),
    resourceLine,
    ...hintLines(
      preferences.learningStyles,
      LEARNING_STYLES_AI_HINTS,
      'Preferred content format',
    ),
    ...buildAccessibilityOverrides(preferences),
  ].filter(Boolean);

  return sections.join('\n');
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
