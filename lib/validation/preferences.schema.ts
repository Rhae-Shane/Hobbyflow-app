import { z } from 'zod';
import { AGE_RANGES, RESOURCE_BUDGETS } from '@/constants/preferences';

export const userPreferencesSchema = z.object({
  topGoals: z.array(z.string().min(1)).min(1),
  userRole: z.string().trim().min(1),
  ageRange: z.enum(AGE_RANGES),
  accessibilityNeeds: z.array(z.string().min(1)).min(1),
  learningStrengths: z.array(z.string().min(1)),
  practiceEnvironments: z.array(z.string().min(1)).min(1),
  resourceBudget: z.enum(RESOURCE_BUDGETS),
  learningStyles: z.array(z.string().min(1)).min(1),
  contentLanguage: z.string().min(1),
});

export const partialUserPreferencesSchema = z.object({
  topGoals: z.array(z.string()).default([]),
  userRole: z.string().default(''),
  ageRange: z.string().default(''),
  accessibilityNeeds: z.array(z.string()).default([]),
  learningStrengths: z.array(z.string()).default([]),
  practiceEnvironments: z.array(z.string()).default([]),
  resourceBudget: z.string().default(''),
  learningStyles: z.array(z.string()).default([]),
  contentLanguage: z.string().default('en'),
});

export type PartialUserPreferencesInput = z.infer<typeof partialUserPreferencesSchema>;
