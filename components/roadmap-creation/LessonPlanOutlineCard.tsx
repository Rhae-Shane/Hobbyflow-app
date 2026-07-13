import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BottomSheetOrModal } from '@/components/BottomSheetOrModal';
import type { GoalCardState, LessonPlanState } from '@/types/roadmapCreation.types';
import { onboardingColors } from '@/constants/onboardingTokens';
import { fonts, radii, spacing } from '@/constants/tokens';
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
    <BottomSheetOrModal
      visible={visible}
      onClose={handleClose}
      maxHeight="85%"
      sheetStyle={styles.modalCard}
    >
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
    </BottomSheetOrModal>
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
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
  },
  title: {
    color: onboardingColors.text,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
  },
  description: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.body,
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
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
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
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  sectionCount: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.bodyMedium,
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
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
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
    fontFamily: fonts.body,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  meaning: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.body,
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
    fontFamily: fonts.bodyBold,
    fontSize: 15,
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
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    letterSpacing: 0.4,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  modalCard: {
    backgroundColor: onboardingColors.background,
    gap: spacing.md,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: onboardingColors.text,
    fontFamily: fonts.display,
    fontSize: 22,
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
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
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
    fontFamily: fonts.body,
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
    fontFamily: fonts.bodyBold,
    fontSize: 15,
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
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
});
