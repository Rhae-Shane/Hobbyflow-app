import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomSheetOrModal } from '@/components/BottomSheetOrModal';
import { onboardingColors } from '@/constants/onboardingTokens';
import { fonts, radii, spacing } from '@/constants/tokens';
import type { RoadmapLessonRow, RoadmapNodeRow } from '@/types/roadmap.types';

type ExerciseLessonPickerProps = {
  visible: boolean;
  onClose: () => void;
  nodes: RoadmapNodeRow[];
  lessons: RoadmapLessonRow[];
  preferredSectionId?: string | null;
  generating?: boolean;
  onConfirm: (lessonId: string) => void;
};

export function ExerciseLessonPicker({
  visible,
  onClose,
  nodes,
  lessons,
  preferredSectionId,
  generating = false,
  onConfirm,
}: ExerciseLessonPickerProps) {
  const sections = useMemo(
    () =>
      nodes
        .filter((n) => n.type === 'Section')
        .sort(
          (a, b) =>
            Number((a.metadata as { sectionIndex?: number }).sectionIndex ?? 0) -
            Number((b.metadata as { sectionIndex?: number }).sectionIndex ?? 0),
        ),
    [nodes],
  );

  const [sectionId, setSectionId] = useState<string | null>(preferredSectionId ?? null);
  const [lessonId, setLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setSectionId(preferredSectionId ?? sections[0]?.id ?? null);
    setLessonId(null);
  }, [visible, preferredSectionId, sections]);

  const activeSectionId = sectionId ?? preferredSectionId ?? sections[0]?.id ?? null;

  const sectionLessons = useMemo(() => {
    if (!activeSectionId) return [];
    const lessonByNode = new Map(lessons.map((l) => [l.node_id, l]));
    return nodes
      .filter((n) => {
        if (n.type !== 'Lesson') return false;
        const meta = n.metadata as { sectionId?: string; isAppliedLesson?: boolean };
        return meta.sectionId === activeSectionId && meta.isAppliedLesson !== true;
      })
      .map((n) => lessonByNode.get(n.id))
      .filter((l): l is RoadmapLessonRow => l != null && l.status !== 'skipped')
      .sort((a, b) => a.path_order - b.path_order);
  }, [activeSectionId, nodes, lessons]);

  return (
    <BottomSheetOrModal visible={visible} onClose={onClose} sheetStyle={styles.sheet}>
      <View style={styles.handle} />
      <Text style={styles.title}>Generate exercises</Text>
      <Text style={styles.subtitle}>Pick a section, then a lesson. We’ll create 2–3 practices.</Text>

      <Text style={styles.label}>Section</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {sections.map((section) => {
          const active = section.id === activeSectionId;
          return (
            <Pressable
              key={section.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                setSectionId(section.id);
                setLessonId(null);
              }}
              testID={`exercise-section-${section.id}`}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{section.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.label}>Lesson</Text>
      <ScrollView style={styles.lessonList} showsVerticalScrollIndicator={false}>
        {sectionLessons.length === 0 ? (
          <Text style={styles.empty}>No lessons in this section.</Text>
        ) : (
          sectionLessons.map((lesson) => {
            const active = lesson.id === lessonId;
            const name = lesson.session_config?.name ?? 'Lesson';
            return (
              <Pressable
                key={lesson.id}
                style={[styles.lessonRow, active && styles.lessonRowActive]}
                onPress={() => setLessonId(lesson.id)}
                testID={`exercise-lesson-${lesson.id}`}
              >
                <Text style={[styles.lessonName, active && styles.lessonNameActive]}>{name}</Text>
                {lesson.session_config?.hook ? (
                  <Text style={styles.lessonHook} numberOfLines={2}>
                    {lesson.session_config.hook}
                  </Text>
                ) : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Pressable
        style={[styles.cta, (!lessonId || generating) && styles.ctaDisabled]}
        disabled={!lessonId || generating}
        onPress={() => {
          if (lessonId) onConfirm(lessonId);
        }}
        testID="exercise-picker-confirm"
      >
        {generating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.ctaText}>Generate 2–3 exercises</Text>
        )}
      </Pressable>
    </BottomSheetOrModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: onboardingColors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: onboardingColors.border,
    marginVertical: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: onboardingColors.text,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: onboardingColors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: onboardingColors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chipScroll: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: onboardingColors.chipBackground,
    borderWidth: 1,
    borderColor: onboardingColors.border,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
  },
  chipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: onboardingColors.textMuted,
  },
  chipTextActive: {
    color: onboardingColors.primaryText,
    fontFamily: fonts.bodySemiBold,
  },
  lessonList: {
    maxHeight: 240,
  },
  lessonRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: onboardingColors.border,
    marginBottom: spacing.sm,
    backgroundColor: onboardingColors.chipBackground,
  },
  lessonRowActive: {
    borderColor: onboardingColors.primaryBorder,
    backgroundColor: onboardingColors.chipSelectedBackground,
  },
  lessonName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: onboardingColors.text,
  },
  lessonNameActive: {
    color: onboardingColors.primaryText,
  },
  lessonHook: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: onboardingColors.textMuted,
    marginTop: 4,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: onboardingColors.textMuted,
    paddingVertical: spacing.md,
  },
  cta: {
    marginTop: spacing.md,
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.card,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#fff',
  },
});
