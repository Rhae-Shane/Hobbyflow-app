import { z } from 'zod';

export const userPreferencesSchema = z.object({
  topGoals: z.array(z.string().min(1)).min(1),
  selectedTags: z.array(z.string().min(1)).min(1),
  userRoles: z.array(z.string().min(1)).min(1),
  learningStyles: z.array(z.string().min(1)).min(1),
  dailyGoal: z.enum(['5', '10', '15', '20']),
  contentLanguage: z.string().min(1),
});

export const partialUserPreferencesSchema = z.object({
  topGoals: z.array(z.string()).default([]),
  selectedTags: z.array(z.string()).default([]),
  userRoles: z.array(z.string()).default([]),
  learningStyles: z.array(z.string()).default([]),
  dailyGoal: z.string().default(''),
  contentLanguage: z.string().default('en'),
});

export type PartialUserPreferencesInput = z.infer<typeof partialUserPreferencesSchema>;
