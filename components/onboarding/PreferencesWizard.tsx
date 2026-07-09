import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NotedSummaryStep } from '@/components/onboarding/NotedSummaryStep';
import { OtherInput } from '@/components/onboarding/OtherInput';
import { PreferenceDataStep } from '@/components/onboarding/PreferenceDataStep';
import { SingleSelectList } from '@/components/onboarding/SingleSelectList';
import { InlineError } from '@/components/ui/InlineError';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { getOptionsForSingleKey, isPresetSingleValue } from '@/lib/preferencesWizardSteps';
import { usePreferencesWizard } from '@/hooks/usePreferencesWizard';

export function PreferencesWizard() {
  const {
    step,
    stepIndex,
    draft,
    otherText,
    setOtherText,
    validationError,
    isSaving,
    initialized,
    displayTitle,
    displaySubtitle,
    canContinue,
    handleBack,
    handleContinue,
    handleAddOther,
    getSelection,
    setSelection,
    setSingleField,
  } = usePreferencesWizard();

  if (!initialized || !step) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={onboardingColors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{displayTitle}</Text>
        {displaySubtitle ? <Text style={styles.subtitle}>{displaySubtitle}</Text> : null}

        {step.kind === 'data' && step.dataKey ? (
          <PreferenceDataStep
            step={{ ...step, dataKey: step.dataKey }}
            selected={getSelection(step.dataKey)}
            otherText={otherText}
            onSelectionChange={setSelection}
            onOtherTextChange={setOtherText}
            onAddOther={handleAddOther}
          />
        ) : null}

        {step.kind === 'single' && step.singleKey ? (
          <>
            <SingleSelectList
              options={getOptionsForSingleKey(step.singleKey)}
              selectedValue={
                isPresetSingleValue(step.singleKey, draft[step.singleKey])
                  ? draft[step.singleKey]
                  : ''
              }
              onChange={(value) => setSingleField(step.singleKey!, value)}
            />
            {step.allowOther ? (
              <OtherInput
                placeholder={step.otherPlaceholder ?? 'Other (optional)'}
                value={
                  draft[step.singleKey] &&
                  !isPresetSingleValue(step.singleKey, draft[step.singleKey])
                    ? draft[step.singleKey]
                    : otherText
                }
                onChange={setOtherText}
              />
            ) : null}
          </>
        ) : null}

        {step.kind === 'summary' ? (
          <NotedSummaryStep selectedStyles={draft.learningStyles} />
        ) : null}

        {step.kind === 'interstitial' && step.emoji ? (
          <View style={styles.illustrationPlaceholder}>
            <Text style={styles.illustrationEmoji}>{step.emoji}</Text>
          </View>
        ) : null}

        {validationError ? <InlineError message={validationError} /> : null}
      </ScrollView>

      <View style={styles.footer}>
        {stepIndex > 0 ? (
          <Pressable
            disabled={isSaving}
            onPress={handleBack}
            style={[styles.backButton, isSaving && styles.buttonDisabled]}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        ) : null}

        <Pressable
          disabled={!canContinue() || isSaving}
          onPress={handleContinue}
          style={[
            styles.continueButton,
            (!canContinue() || isSaving) && styles.buttonDisabled,
            stepIndex === 0 && styles.continueButtonFull,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={onboardingColors.primaryText} />
          ) : (
            <Text style={styles.continueText}>CONTINUE</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: onboardingColors.background,
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    backgroundColor: onboardingColors.background,
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    color: onboardingColors.text,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    color: onboardingColors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  illustrationPlaceholder: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  illustrationEmoji: {
    fontSize: 72,
  },
  footer: {
    borderTopColor: onboardingColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    alignItems: 'center',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 88,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButtonText: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.card,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  continueButtonFull: {
    flex: 1,
  },
  continueText: {
    color: onboardingColors.primaryText,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
