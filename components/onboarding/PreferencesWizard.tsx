import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  MeditatingDoodle,
  PlantDoodle,
  ReadingDoodle,
  SittingDoodle,
} from '@/components/home/categoryIllustrations';
import { NotedSummaryStep } from '@/components/onboarding/NotedSummaryStep';
import { OnboardingProgressHeader } from '@/components/onboarding/OnboardingProgressHeader';
import { OnboardingPromptBubble } from '@/components/onboarding/OnboardingPromptBubble';
import { OtherInput } from '@/components/onboarding/OtherInput';
import { PreferenceDataStep } from '@/components/onboarding/PreferenceDataStep';
import { SingleSelectList } from '@/components/onboarding/SingleSelectList';
import { InlineError } from '@/components/ui/InlineError';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';
import {
  getOptionsForSingleKey,
  isPresetSingleValue,
  WIZARD_STEPS,
  type OnboardingIllustrationKey,
} from '@/lib/preferencesWizardSteps';
import { usePreferencesWizard } from '@/hooks/usePreferencesWizard';

const ILLUSTRATIONS: Record<OnboardingIllustrationKey, typeof PlantDoodle> = {
  plant: PlantDoodle,
  reading: ReadingDoodle,
  sitting: SittingDoodle,
  meditating: MeditatingDoodle,
};

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
        <ActivityIndicator color={theme.colors.accentDeep} size="large" />
      </View>
    );
  }

  const Illustration = step.illustration ? ILLUSTRATIONS[step.illustration] : null;
  const isChoiceStep = step.kind === 'single' || step.kind === 'data';
  const isInterstitial = step.kind === 'interstitial' || step.kind === 'summary';
  const isLast = stepIndex === WIZARD_STEPS.length - 1;

  return (
    <View style={styles.screen}>
      <OnboardingProgressHeader
        stepIndex={stepIndex}
        stepCount={WIZARD_STEPS.length}
        showBack={stepIndex > 0}
        onBack={handleBack}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isChoiceStep ? (
          <OnboardingPromptBubble title={displayTitle} subtitle={displaySubtitle} />
        ) : null}

        {isInterstitial && Illustration ? (
          <View style={styles.illustrationPanel}>
            <Illustration width={160} height={160} color={theme.colors.text} />
          </View>
        ) : null}

        {isInterstitial ? (
          <>
            <Text style={styles.interstitialTitle}>{displayTitle}</Text>
            {displaySubtitle ? (
              <Text style={styles.interstitialSubtitle}>{displaySubtitle}</Text>
            ) : null}
          </>
        ) : null}

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
              <View style={styles.otherWrap}>
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
              </View>
            ) : null}
          </>
        ) : null}

        {step.kind === 'summary' ? (
          <View style={styles.summaryWrap}>
            <NotedSummaryStep selectedStyles={draft.learningStyles} />
          </View>
        ) : null}

        {validationError ? (
          <View style={styles.errorWrap}>
            <InlineError message={validationError} />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          disabled={!canContinue() || isSaving}
          onPress={handleContinue}
          style={[styles.nextButton, (!canContinue() || isSaving) && styles.buttonDisabled]}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.colors.ctaText} />
          ) : (
            <Text style={styles.nextText}>{isLast ? 'Finish' : 'Next'}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  illustrationPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.block,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  interstitialTitle: {
    color: theme.colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.3,
    lineHeight: 32,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
  },
  interstitialSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
  },
  otherWrap: {
    paddingHorizontal: spacing.md,
  },
  summaryWrap: {
    paddingHorizontal: spacing.md,
  },
  errorWrap: {
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  nextButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.cta,
    borderRadius: theme.radii.block,
    justifyContent: 'center',
    paddingVertical: 18,
  },
  nextText: {
    color: theme.colors.ctaText,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
