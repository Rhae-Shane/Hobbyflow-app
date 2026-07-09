import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/errors';
import { createLogger } from '@/lib/logger';
import { apiRequest } from '@/services/client';
import type { Plan } from '@/types/plan.types';
import type { PlanRequestInput } from '@/lib/validation/planRequest.schema';
import { usePlanStore } from '@/store/usePlanStore';

const log = createLogger('queries');

export function useGeneratePlan() {
  const setPlan = usePlanStore((s) => s.setPlan);

  return useMutation({
    mutationFn: (input: PlanRequestInput) =>
      apiRequest<Plan>('/api/v1/plans', { method: 'POST', body: input }),
    onSuccess: (plan) => {
      log.info('Plan generated in app', { hobby: plan.hobby, techniqueCount: plan.techniques.length });
      setPlan(plan);
    },
    onError: (error: Error, input) => {
      const details =
        error instanceof ApiError
          ? { code: error.code, status: error.status, requestId: error.requestId }
          : { error: error.message };
      log.error('Plan generation failed', { hobby: input.hobby, ...details });
    },
  });
}

export function useReplaceTechnique() {
  const queryClient = useQueryClient();
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
      log.info('Technique replaced in app', {
        techniqueId: variables.techniqueId,
        hobby: variables.hobby,
      });
      replaceTechnique(variables.techniqueId, data.technique);
      void queryClient.invalidateQueries();
    },
    onError: (error: Error, variables) => {
      const details =
        error instanceof ApiError
          ? { code: error.code, status: error.status, requestId: error.requestId }
          : { error: error.message };
      log.error('Technique replacement failed', {
        techniqueId: variables.techniqueId,
        hobby: variables.hobby,
        ...details,
      });
    },
  });
}
