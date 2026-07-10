import type { GoalCardState, LessonPlanState } from '@/types/roadmapCreation.types';
import type { DisplayMessage } from '@/types/roadmapCreation.types';
import type { UserPreferences } from '@/types/preferences.types';
import { buildPreferencesAiContext } from '@/constants/preferences';

const MINUTES_PER_LESSON = 5;

export const OUTLINE_CHANGE_SUGGESTIONS = [
  'Make it shorter',
  'Add more detail',
  'Make it easier',
  'Make it more advanced',
  'Focus more on basics',
  'Add practical examples',
] as const;

export function countOutlineLessons(lessonPlan: LessonPlanState): number {
  return lessonPlan.sections.reduce((sum, section) => sum + section.lessons.length, 0);
}

export function estimateOutlineMinutes(lessonPlan: LessonPlanState): number {
  return countOutlineLessons(lessonPlan) * MINUTES_PER_LESSON;
}

export function estimateOutlineDays(
  lessonPlan: LessonPlanState,
  dailyMinutes = 15,
): number {
  return Math.max(1, Math.ceil(estimateOutlineMinutes(lessonPlan) / dailyMinutes));
}

export function buildOutlineMetaChips(
  lessonPlan: LessonPlanState,
  dailyMinutes = 15,
): string[] {
  const sections = lessonPlan.sections.length;
  const lessons = countOutlineLessons(lessonPlan);
  const minutes = estimateOutlineMinutes(lessonPlan);
  const days = estimateOutlineDays(lessonPlan, dailyMinutes);
  return [
    `${sections} section${sections === 1 ? '' : 's'}`,
    `${lessons} lesson${lessons === 1 ? '' : 's'}`,
    `~${minutes} min total`,
    `~${days} day${days === 1 ? '' : 's'} at ${dailyMinutes} min daily goal`,
  ];
}

/** Inspo-style topic block used when generating / refining outlines and final plans. */
export function buildTopicRequestContent(
  goalCard: GoalCardState,
  messages: DisplayMessage[],
): string {
  const conversation = messages
    .map((m) => `${m.role}: ${m.content.trim()}`)
    .filter((line) => line.length > 8)
    .join('\n');

  return [
    '[Topic Request]',
    `Course: ${goalCard.suggestedName}`,
    `Goal: ${goalCard.suggestedGoal}`,
    `Current Background Knowledge: ${goalCard.suggestedBackground}`,
    '',
    'User conversation:',
    conversation,
  ].join('\n');
}

export function buildFullPlanLearnerContext(options: {
  preferences: UserPreferences | null | undefined;
  goalCard: GoalCardState;
  messages: DisplayMessage[];
  lessonPlan: LessonPlanState;
}): string {
  const prefContext = options.preferences
    ? buildPreferencesAiContext(options.preferences)
    : '';

  const outlineLines = options.lessonPlan.sections
    .map((section, sIdx) => {
      const lessons = section.lessons
        .map(
          (lesson, lIdx) =>
            `  ${sIdx + 1}.${lIdx + 1}. ${lesson.name}\n     Hook: ${lesson.hook}\n     Meaning: ${lesson.meaning}`,
        )
        .join('\n');
      return `${sIdx + 1}. ${section.name}\n${lessons}`;
    })
    .join('\n');

  const techniqueOrderHint = options.lessonPlan.sections
    .flatMap((section, sIdx) =>
      section.lessons.map(
        (lesson, lIdx) => `${sIdx + 1}.${lIdx + 1} ${lesson.name} (${section.name})`,
      ),
    )
    .join(' → ');

  const blocks = [
    prefContext,
    '--- Confirmed roadmap goal ---',
    `Hobby: ${options.goalCard.suggestedHobby}`,
    `Title: ${options.goalCard.suggestedName}`,
    `Goal: ${options.goalCard.suggestedGoal}`,
    `Background: ${options.goalCard.suggestedBackground}`,
    `Level: ${options.goalCard.suggestedLevel}`,
    '',
    buildTopicRequestContent(options.goalCard, options.messages),
    '',
    '--- APPROVED ROADMAP OUTLINE (mandatory learning path) ---',
    `Course title: ${options.lessonPlan.courseTitle}`,
    `Lesson plan id: ${options.lessonPlan.lessonPlanId}`,
    outlineLines,
    '',
    'MANDATORY PLAN RULES:',
    '- Turn this outline into the hobby learning roadmap / technique path.',
    '- Each technique MUST map to an outline lesson (use lesson names closely).',
    '- Preserve section progression and lesson order.',
    `- Suggested technique order: ${techniqueOrderHint}`,
    '- Do not invent a different curriculum that ignores this outline.',
    '- Respect accessibility and practice constraints from preferences above.',
  ].filter(Boolean);

  return blocks.join('\n').slice(0, 8000);
}
