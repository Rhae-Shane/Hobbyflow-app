import { useMutation } from '@tanstack/react-query';
import { apiRequest } from './client';
import type { Plan } from '../types/plan.types';
import type { PlanRequestInput } from '../validation/planRequest.schema';
import { usePlanStore } from '../store/usePlanStore';

export function useGeneratePlan() {
  const setPlan = usePlanStore((s) => s.setPlan);

  return useMutation({
    mutationFn: (input: PlanRequestInput) =>
      apiRequest<Plan>('/api/v1/plans', { method: 'POST', body: input }),
    onSuccess: (plan) => setPlan(plan),
  });
}

export function useReplaceTechnique() {
  const replaceTechnique = usePlanStore((s) => s.replaceTechnique);

  return useMutation({
    mutationFn: (body: {
      techniqueId: string;
      hobby: string;
      level: Plan['level'];
      goal: string;
      remainingTechniques: string[];
    }) => apiRequest<{ technique: Plan['techniques'][number] }>('/api/v1/plans/replace', {
      method: 'POST',
      body,
    }),
    onSuccess: (data, variables) => {
      replaceTechnique(variables.techniqueId, data.technique);
    },
  });
}
