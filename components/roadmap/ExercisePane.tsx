import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExerciseLessonPicker } from '@/components/roadmap/ExerciseLessonPicker';
import { ExerciseListItem } from '@/components/roadmap/ExerciseListItem';
import { InlineError } from '@/components/ui/InlineError';
import { onboardingColors } from '@/constants/onboardingTokens';
import { fonts, radii, spacing } from '@/constants/tokens';
import { showAlert } from '@/store/useAlertStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { ApiError } from '@/lib/errors';
import {
  completeExercise,
  generateExercises,
  incompleteExercise,
  listExercises,
  regenerateExercise,
} from '@/services/exercises';
import type { RoadmapExerciseRow } from '@/types/exercise.types';
import type { RoadmapLessonRow, RoadmapNodeRow } from '@/types/roadmap.types';
import type { ReactNode } from 'react';

type ExercisePaneProps = {
  roadmapId: string;
  nodes: RoadmapNodeRow[];
  lessons: RoadmapLessonRow[];
  sectionFilterId?: string | null;
  header: ReactNode;
  bottomInset?: number;
};

export function ExercisePane({
  roadmapId,
  nodes,
  lessons,
  sectionFilterId,
  header,
  bottomInset = 0,
}: ExercisePaneProps) {
  const queryClient = useQueryClient();
  const applyGamificationSnapshot = useGamificationStore((s) => s.applyGamificationSnapshot);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const exercisesQuery = useQuery({
    queryKey: ['roadmap-exercises', roadmapId, sectionFilterId ?? 'all'],
    queryFn: () =>
      listExercises(roadmapId, sectionFilterId ? { sectionId: sectionFilterId } : {}),
  });

  const exercises = exercisesQuery.data?.exercises ?? [];

  const grouped = useMemo(() => {
    const byLesson = new Map<string, RoadmapExerciseRow[]>();
    for (const ex of exercises) {
      const list = byLesson.get(ex.lesson_id) ?? [];
      list.push(ex);
      byLesson.set(ex.lesson_id, list);
    }
    return [...byLesson.entries()].map(([lessonId, items]) => {
      const lesson = lessons.find((l) => l.id === lessonId);
      return {
        lessonId,
        title: lesson?.session_config?.name ?? 'Lesson',
        items: items.sort((a, b) => a.sort_order - b.sort_order),
      };
    });
  }, [exercises, lessons]);

  const generateMutation = useMutation({
    mutationFn: (lessonId: string) => generateExercises(roadmapId, lessonId),
    onSuccess: async () => {
      setPickerOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['roadmap-exercises', roadmapId] });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not generate exercises';
      showAlert('Generate failed', message);
    },
  });

  const onToggleComplete = async (exercise: RoadmapExerciseRow) => {
    setBusyId(exercise.id);
    try {
      if (exercise.status === 'complete') {
        await incompleteExercise(roadmapId, exercise.id);
      } else {
        const result = await completeExercise(roadmapId, exercise.id);
        applyGamificationSnapshot(result.gamification);
      }
      await queryClient.invalidateQueries({ queryKey: ['roadmap-exercises', roadmapId] });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not update exercise';
      showAlert('Update failed', message);
    } finally {
      setBusyId(null);
    }
  };

  const onRegenerate = async (exercise: RoadmapExerciseRow) => {
    setBusyId(exercise.id);
    try {
      await regenerateExercise(roadmapId, exercise.id);
      await queryClient.invalidateQueries({ queryKey: ['roadmap-exercises', roadmapId] });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not regenerate exercise';
      showAlert('Regenerate failed', message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={styles.root}>
      {header}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + bottomInset }]}
        showsVerticalScrollIndicator={false}
      >
        {exercisesQuery.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={onboardingColors.primaryText} />
          </View>
        ) : exercisesQuery.isError ? (
          <InlineError message="Couldn't load exercises." />
        ) : exercises.length === 0 ? (
          <View style={styles.empty} testID="exercise-empty">
            <Text style={styles.emptyTitle}>Practice this roadmap</Text>
            <Text style={styles.emptyBody}>
              Generate 2–3 lesson-scoped exercises shaped to your hobby and preferences.
            </Text>
            <Pressable
              style={styles.cta}
              onPress={() => setPickerOpen(true)}
              testID="exercise-generate-cta"
            >
              <Text style={styles.ctaText}>Generate exercises</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {grouped.map((group) => (
              <View key={group.lessonId} style={styles.group}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                {group.items.map((ex) => (
                  <ExerciseListItem
                    key={ex.id}
                    exercise={ex}
                    busy={busyId === ex.id}
                    onToggleComplete={onToggleComplete}
                    onRegenerate={onRegenerate}
                  />
                ))}
              </View>
            ))}
            <Pressable
              style={styles.secondaryCta}
              onPress={() => setPickerOpen(true)}
              testID="exercise-generate-another"
            >
              <Text style={styles.secondaryCtaText}>Generate for another lesson</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <ExerciseLessonPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        nodes={nodes}
        lessons={lessons}
        preferredSectionId={sectionFilterId}
        generating={generateMutation.isPending}
        onConfirm={(lessonId) => generateMutation.mutate(lessonId)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  centered: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  empty: {
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: onboardingColors.text,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: onboardingColors.textMuted,
    marginBottom: spacing.md,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: '#fff',
  },
  list: {
    gap: spacing.lg,
  },
  group: {
    gap: spacing.xs,
  },
  groupTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: onboardingColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  secondaryCta: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
  secondaryCtaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: onboardingColors.primaryText,
  },
});
