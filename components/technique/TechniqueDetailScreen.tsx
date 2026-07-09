import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { BottomSheetOrModal } from '@/components/BottomSheetOrModal';
import { InlineError } from '@/components/ui/InlineError';
import { InAppResourceViewer } from '@/components/technique/InAppResourceViewer';
import { ReplaceTechniqueSheet } from '@/components/technique/ReplaceTechniqueSheet';
import { ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { useReplaceTechnique } from '@/services/queries';
import { usePlanStore } from '@/store/usePlanStore';
import {
  shouldOpenResourceInApp,
  toInAppYouTubeUrl,
} from '@/utils/resourceNavigation';
import { buildResourceUrl } from '@/utils/resourceUrlBuilder';
import type { Modality } from '@/types/plan.types';
import { colors, radii, spacing } from '@/constants/tokens';

const MODALITY_LABELS: Record<Modality, string> = {
  video: 'Video',
  article: 'Article',
  audio: 'Audio',
  interactive: 'Interactive',
};

export function TechniqueDetailScreen() {
  const router = useRouter();
  const { techniqueId } = useLocalSearchParams<{ techniqueId: string }>();
  const plan = usePlanStore((s) => s.plan);
  const updateTechniqueStatus = usePlanStore((s) => s.updateTechniqueStatus);
  const updateTechniqueNotes = usePlanStore((s) => s.updateTechniqueNotes);
  const replaceMutation = useReplaceTechnique();

  const [actionsVisible, setActionsVisible] = useState(false);
  const [replaceVisible, setReplaceVisible] = useState(false);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [resourceViewerUrl, setResourceViewerUrl] = useState<string | null>(null);

  const technique = plan?.techniques.find((t) => t.id === techniqueId);

  const handleOpenResource = useCallback(async () => {
    if (!technique || !plan) return;
    setResourceError(null);
    const url = buildResourceUrl(technique.modality, technique.searchQuery, plan.hobby);

    if (shouldOpenResourceInApp(technique.modality)) {
      setResourceViewerUrl(toInAppYouTubeUrl(url));
      return;
    }

    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      setResourceError(getKnownUserMessage(ErrorCodes.BROWSER_UNAVAILABLE));
    }
  }, [plan, technique]);

  const handleMarkInProgress = useCallback(() => {
    if (!techniqueId) return;
    updateTechniqueStatus(techniqueId, 'in_progress');
    setActionsVisible(false);
  }, [techniqueId, updateTechniqueStatus]);

  const handleMarkMastered = useCallback(() => {
    if (!techniqueId) return;
    updateTechniqueStatus(techniqueId, 'mastered');
    setActionsVisible(false);
    void import('@/utils/celebrateMastered')
      .then(({ celebrateMastered }) => celebrateMastered())
      .catch(() => {
        // Confetti is optional — never block the mastered flow.
      });
    router.back();
  }, [router, techniqueId, updateTechniqueStatus]);

  const handleSkip = useCallback(() => {
    if (!techniqueId) return;
    updateTechniqueStatus(techniqueId, 'skipped');
    setActionsVisible(false);
    router.back();
  }, [router, techniqueId, updateTechniqueStatus]);

  const runReplace = useCallback(() => {
    if (!plan || !techniqueId) return;

    replaceMutation.mutate(
      {
        techniqueId,
        hobby: plan.hobby,
        level: plan.level,
        goal: plan.goal,
        remainingTechniques: plan.techniques
          .filter(
            (t) =>
              t.status !== 'mastered' && t.status !== 'skipped' && t.id !== techniqueId,
          )
          .map((t) => t.name),
      },
      {
        onSuccess: () => {
          setReplaceVisible(false);
          router.back();
        },
      },
    );
  }, [plan, replaceMutation, router, techniqueId]);

  const handleTooDifficult = useCallback(() => {
    setActionsVisible(false);
    setReplaceVisible(true);
    replaceMutation.reset();
    runReplace();
  }, [replaceMutation, runReplace]);

  const closeReplaceSheet = useCallback(() => {
    setReplaceVisible(false);
    replaceMutation.reset();
  }, [replaceMutation]);

  if (!technique || !plan) {
    return (
      <View style={styles.container}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>← Back</Text>
        </Pressable>
        <Text style={styles.notFound}>Technique not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>← Back</Text>
        </Pressable>

        <Text style={styles.name}>{technique.name}</Text>

        <View style={styles.metaRow}>
          <View style={styles.modalityBadge}>
            <Text style={styles.modalityText}>{MODALITY_LABELS[technique.modality]}</Text>
          </View>
          <Text style={styles.minutes}>~{technique.estimatedMinutes} min</Text>
        </View>

        <Text style={styles.sectionLabel}>Why it matters</Text>
        <Text style={styles.why}>{technique.why}</Text>

        <Pressable style={styles.resourceButton} onPress={handleOpenResource}>
          <Text style={styles.resourceButtonText}>Open resource</Text>
        </Pressable>
        {resourceError ? <InlineError message={resourceError} /> : null}

        <Text style={styles.sectionLabel}>Personal notes</Text>
        <TextInput
          multiline
          placeholder="Add your notes..."
          placeholderTextColor={colors.textMuted}
          style={styles.notesInput}
          value={technique.notes ?? ''}
          onChangeText={(text) => updateTechniqueNotes(technique.id, text)}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.actionsButton} onPress={() => setActionsVisible(true)}>
          <Text style={styles.actionsButtonText}>Update status</Text>
        </Pressable>
      </View>

      <BottomSheetOrModal visible={actionsVisible} onClose={() => setActionsVisible(false)}>
        <Text style={styles.sheetTitle}>Update status</Text>
        <Pressable style={styles.actionItem} onPress={handleMarkInProgress}>
          <Text style={styles.actionText}>Mark In Progress</Text>
        </Pressable>
        <Pressable style={styles.actionItem} onPress={handleMarkMastered}>
          <Text style={styles.actionText}>Mark Mastered</Text>
        </Pressable>
        <Pressable style={styles.actionItem} onPress={handleSkip}>
          <Text style={styles.actionText}>Skip</Text>
        </Pressable>
        <Pressable style={styles.actionItem} onPress={handleTooDifficult}>
          <Text style={[styles.actionText, styles.actionDanger]}>Too difficult</Text>
        </Pressable>
      </BottomSheetOrModal>

      <BottomSheetOrModal visible={replaceVisible} onClose={closeReplaceSheet}>
        <ReplaceTechniqueSheet
          isPending={replaceMutation.isPending}
          isError={replaceMutation.isError}
          onClose={closeReplaceSheet}
          onRetry={runReplace}
        />
      </BottomSheetOrModal>

      <InAppResourceViewer
        visible={resourceViewerUrl !== null}
        url={resourceViewerUrl ?? ''}
        title={technique.name}
        onClose={() => setResourceViewerUrl(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backLink: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  notFound: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: spacing.lg,
  },
  name: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalityBadge: {
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  modalityText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  minutes: {
    color: colors.textMuted,
    fontSize: 14,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  why: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  resourceButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.card,
    padding: spacing.md,
  },
  resourceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 120,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.lg,
  },
  actionsButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.md,
  },
  actionsButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  actionItem: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
  },
  actionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  actionDanger: {
    color: '#DC2626',
  },
});
