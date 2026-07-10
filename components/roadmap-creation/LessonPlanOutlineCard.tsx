import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { GoalCardState, LessonPlanState } from '@/types/roadmapCreation.types';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import {
  buildOutlineMetaChips,
  OUTLINE_CHANGE_SUGGESTIONS,
} from '@/lib/roadmap-creation/outlineHelpers';

type OutlineProps = {
  lessonPlan: LessonPlanState;
  goalCard: GoalCardState | null;
  onRequestChanges: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

type ChangesModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (change: string) => void;
  isSubmitting?: boolean;
};

export function RequestChangesModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
}: ChangesModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');

  const handleSelect = (suggestion: string) => {
    setSelected(suggestion);
    setCustomText(suggestion);
  };

  const handleSubmit = () => {
    const value = customText.trim() || selected?.trim();
    if (!value) return;
    onSubmit(value);
    setSelected(null);
    setCustomText('');
  };

  const handleClose = () => {
    setSelected(null);
    setCustomText('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Changes</Text>
            <Pressable onPress={handleClose} hitSlop={12} disabled={isSubmitting}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.suggestionWrap}>
            {OUTLINE_CHANGE_SUGGESTIONS.map((suggestion) => {
              const isSelected = selected === suggestion;
              return (
                <Pressable
                  key={suggestion}
                  style={[styles.suggestionChip, isSelected && styles.suggestionChipSelected]}
                  onPress={() => handleSelect(suggestion)}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.suggestionText,
                      isSelected && styles.suggestionTextSelected,
                    ]}
                  >
                    {suggestion}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            style={styles.changeInput}
            value={customText}
            onChangeText={setCustomText}
            placeholder="Describe the changes you want…"
            placeholderTextColor={onboardingColors.textMuted}
            multiline
            editable={!isSubmitting}
          />

          <View style={styles.modalActions}>
            <Pressable
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </Pressable>
            <Pressable
              style={[
                styles.submitButton,
                (!customText.trim() || isSubmitting) && styles.ctaDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!customText.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={onboardingColors.primaryText} />
              ) : (
                <Text style={styles.submitButtonText}>SUBMIT</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function LessonPlanOutlineCard({
  lessonPlan,
  goalCard,
  onRequestChanges,
  onConfirm,
  isLoading = false,
}: OutlineProps) {
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
  const metaChips = useMemo(() => buildOutlineMetaChips(lessonPlan), [lessonPlan]);

  const toggleLesson = (key: string) => {
    setExpandedLessons((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.navLabel}>Roadmap outline</Text>
      <Text style={styles.title}>{lessonPlan.courseTitle}</Text>
      {goalCard?.suggestedGoal ? (
        <Text style={styles.description}>{goalCard.suggestedGoal}</Text>
      ) : null}

      <View style={styles.chipRow}>
        {metaChips.map((chip) => (
          <View key={chip} style={styles.metaChip}>
            <Text style={styles.metaChipText}>{chip}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {lessonPlan.sections.map((section, sectionIndex) => (
          <View key={`${section.name}-${sectionIndex}`} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>
              {sectionIndex + 1}. {section.name}
              <Text style={styles.sectionCount}>
                {' '}
                ({section.lessons.length} lesson{section.lessons.length === 1 ? '' : 's'})
              </Text>
            </Text>

            {section.lessons.map((lesson, lessonIndex) => {
              const key = `${sectionIndex}-${lessonIndex}-${lesson.name}`;
              const expanded = Boolean(expandedLessons[key]);
              return (
                <Pressable
                  key={key}
                  style={[styles.lessonRow, expanded && styles.lessonRowExpanded]}
                  onPress={() => toggleLesson(key)}
                >
                  <View style={styles.lessonHeader}>
                    <Text style={styles.lessonName}>
                      {sectionIndex + 1}.{lessonIndex + 1}. {lesson.name}
                    </Text>
                    <Text style={styles.chevron}>{expanded ? '▾' : '›'}</Text>
                  </View>
                  {expanded ? (
                    <View style={styles.lessonBody}>
                      <Text style={styles.hook}>{lesson.hook}</Text>
                      <Text style={styles.meaning}>{lesson.meaning}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.secondaryCta, isLoading && styles.ctaDisabled]}
          onPress={onRequestChanges}
          disabled={isLoading}
        >
          <Text style={styles.secondaryCtaText}>REQUEST CHANGES</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryCta, isLoading && styles.ctaDisabled]}
          onPress={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={onboardingColors.primaryText} />
          ) : (
            <Text style={styles.primaryCtaText}>CREATE ROADMAP</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing.sm,
  },
  navLabel: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: onboardingColors.text,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  description: {
    color: onboardingColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaChip: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  metaChipText: {
    color: onboardingColors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  sectionBlock: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    color: onboardingColors.textMuted,
    fontWeight: '500',
  },
  lessonRow: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  lessonRowExpanded: {
    backgroundColor: '#F3F0E8',
  },
  lessonHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  lessonName: {
    color: onboardingColors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  chevron: {
    color: onboardingColors.textMuted,
    fontSize: 18,
  },
  lessonBody: {
    gap: 4,
    marginTop: spacing.sm,
  },
  hook: {
    color: onboardingColors.text,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  meaning: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  secondaryCta: {
    alignItems: 'center',
    backgroundColor: onboardingColors.background,
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    paddingVertical: spacing.md,
  },
  secondaryCtaText: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  primaryCta: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.card,
    paddingVertical: spacing.md,
  },
  primaryCtaText: {
    color: onboardingColors.primaryText,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: onboardingColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: spacing.md,
    maxHeight: '85%',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: onboardingColors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  modalClose: {
    color: onboardingColors.textMuted,
    fontSize: 22,
    paddingHorizontal: 4,
  },
  suggestionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  suggestionChipSelected: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
  },
  suggestionText: {
    color: onboardingColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionTextSelected: {
    color: onboardingColors.primaryText,
  },
  changeInput: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: onboardingColors.text,
    fontSize: 15,
    minHeight: 110,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flex: 1,
    paddingVertical: spacing.md,
  },
  cancelButtonText: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.card,
    flex: 1,
    paddingVertical: spacing.md,
  },
  submitButtonText: {
    color: onboardingColors.primaryText,
    fontSize: 15,
    fontWeight: '800',
  },
});
