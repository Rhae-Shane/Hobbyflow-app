import { z } from 'zod';

export const levelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const timeBudgetSchema = z.enum(['15 min/day', '30 min/day', '1 hr/day']);

export const planRequestSchema = z.object({
  hobby: z.string().trim().min(1, 'Pick or enter a hobby'),
  level: levelSchema,
  goal: z.string().trim().optional().default(''),
  timeBudget: timeBudgetSchema,
});

export type PlanRequestInput = z.infer<typeof planRequestSchema>;
