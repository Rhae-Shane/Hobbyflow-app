import { buildPreferencesAiContext } from '@/constants/preferences';
import type { PlanRequestInput } from '@/lib/validation/planRequest.schema';
import type { GoalCardState } from '@/types/roadmapCreation.types';
import type { UserPreferences } from '@/types/preferences.types';
import type { DisplayMessage } from '@/types/roadmapCreation.types';

export function buildRoadmapCreationLearnerContext(
  preferences: UserPreferences | null | undefined,
  goalCard: GoalCardState,
  messages: DisplayMessage[],
): string {
  const prefContext = preferences ? buildPreferencesAiContext(preferences) : '';
  const userStatedGoals = messages
    .filter((m) => m.role === 'user')
    .map((m) => `- ${m.content.trim()}`)
    .join('\n');

  const blocks = [
    prefContext,
    '--- Roadmap creation context ---',
    `Background: ${goalCard.suggestedBackground}`,
    `Roadmap focus: ${goalCard.suggestedName}`,
    `Hobby: ${goalCard.suggestedHobby}`,
    userStatedGoals ? `User stated goals (from chat):\n${userStatedGoals}` : '',
  ].filter(Boolean);

  return blocks.join('\n\n').slice(0, 8000);
}

export function buildPlanRequestFromGoalCard(
  goalCard: GoalCardState,
  preferences: UserPreferences | null | undefined,
  messages: DisplayMessage[],
  timeBudget: PlanRequestInput['timeBudget'] = '30 min/day',
): PlanRequestInput {
  return {
    hobby: goalCard.suggestedHobby,
    level: goalCard.suggestedLevel,
    goal: goalCard.suggestedGoal,
    timeBudget,
    learnerContext: buildRoadmapCreationLearnerContext(preferences, goalCard, messages),
  };
}
