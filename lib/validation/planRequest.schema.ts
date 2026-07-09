import { z } from 'zod';

export const levelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const timeBudgetSchema = z.enum(['15 min/day', '30 min/day', '1 hr/day']);

export const planRequestSchema = z.object({
  hobby: z.string().trim().min(1, 'Pick or enter a hobby'),
  level: levelSchema,
  goal: z.string().trim().optional().default(''),
  timeBudget: timeBudgetSchema,
  /** Pre-rendered learner profile from onboarding preferences for AI personalization. */
  learnerContext: z.string().trim().max(8000).optional(),
});

export type PlanRequestInput = z.infer<typeof planRequestSchema>;
