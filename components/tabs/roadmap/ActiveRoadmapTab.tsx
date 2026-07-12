import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BootSpinner } from '@/components/BootSpinner';
import { FLOATING_TAB_BAR_HEIGHT } from '@/components/navigation/tabBarLayout';
import { RoadmapHomeScreen } from '@/components/roadmap/RoadmapHomeScreen';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserRoadmaps } from '@/services/roadmaps';
import { useRoadmapUiStore } from '@/store/useRoadmapUiStore';

export function ActiveRoadmapTab() {
  const router = useRouter();
  const { user } = useAuth();
  const selectedRoadmapId = useRoadmapUiStore((s) => s.selectedRoadmapId);
  const setSelectedRoadmapId = useRoadmapUiStore((s) => s.setSelectedRoadmapId);
  const [roadmapId, setRoadmapId] = useState<string | null>(selectedRoadmapId);
  const [loading, setLoading] = useState(!selectedRoadmapId);

  useEffect(() => {
    if (selectedRoadmapId) {
      setRoadmapId(selectedRoadmapId);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const rows = await fetchUserRoadmaps(user.id);
      if (cancelled) return;
      const preferred =
        rows.find((r) => r.status === 'active') ?? rows.find((r) => r.status === 'preview') ?? rows[0];
      setRoadmapId(preferred?.id ?? null);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, selectedRoadmapId]);

  if (loading) {
    return <BootSpinner />;
  }

  if (!roadmapId) {
    return (
      <View style={styles.empty}>
        <Text style={styles.brand}>HobbyFlow</Text>
        <Text style={styles.title}>No roadmap yet</Text>
        <Text style={styles.body}>
          Generate a personalized learning path from the Generation tab.
        </Text>
        <Pressable
          style={styles.cta}
          onPress={() => router.push('/(app)/(tabs)/generate' as never)}
        >
          <Text style={styles.ctaText}>Start generating</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <RoadmapHomeScreen
      roadmapId={roadmapId}
      onRoadmapChange={(nextId) => {
        setSelectedRoadmapId(nextId);
        setRoadmapId(nextId);
      }}
      contentBottomInset={FLOATING_TAB_BAR_HEIGHT + 24}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: onboardingColors.background,
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingBottom: FLOATING_TAB_BAR_HEIGHT + 40,
  },
  brand: {
    color: onboardingColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  title: {
    color: onboardingColors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  body: {
    color: onboardingColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.card,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  ctaText: {
    color: onboardingColors.primaryText,
    fontWeight: '800',
  },
});
