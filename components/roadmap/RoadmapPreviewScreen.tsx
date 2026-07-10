import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { BootSpinner } from '@/components/BootSpinner';
import { InlineError } from '@/components/ui/InlineError';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { activateRoadmap, fetchRoadmapDetail } from '@/services/roadmaps';
import { fetchUserHobbies } from '@/services/hobbies';
import { useAuth } from '@/hooks/useAuth';
import { usePlanStore } from '@/store/usePlanStore';
import { useRoadmapUiStore } from '@/store/useRoadmapUiStore';
import { useUserStore } from '@/store/useUserStore';

function parseAchievementBullets(raw: string): Array<{ bold: string; rest: string }> {
  return raw
    .split('\n')
    .map((line) => line.replace(/^\*\s*/, '').trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\*\*(.+?)\*\*\s*(.*)$/);
      if (match) {
        return { bold: match[1], rest: match[2] };
      }
      return { bold: line, rest: '' };
    });
}

export function RoadmapPreviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const setHobbies = usePlanStore((s) => s.setHobbies);
  const setCompletedOnboardingAt = useUserStore((s) => s.setCompletedOnboardingAt);

  const detailQuery = useQuery({
    queryKey: ['roadmap-detail', id],
    queryFn: () => fetchRoadmapDetail(id!),
    enabled: Boolean(id),
  });

  const achievements = useMemo(() => {
    const raw = detailQuery.data?.roadmap.intro?.achievements ?? '';
    return parseAchievementBullets(raw);
  }, [detailQuery.data?.roadmap.intro?.achievements]);

  const handleGoToRoadmap = async () => {
    if (!id || !user) return;
    useRoadmapUiStore.getState().setSelectedRoadmapId(id);
    try {
      const activated = await activateRoadmap(id);
      const hobbies = await fetchUserHobbies(user.id);
      setHobbies(hobbies);
      usePlanStore.setState({ activeHobbyId: activated.hobby_id });
      setCompletedOnboardingAt(new Date().toISOString());
      router.replace('/(app)/(tabs)');
    } catch {
      router.replace('/(app)/(tabs)');
    }
  };

  if (detailQuery.isLoading) {
    return <BootSpinner />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <View style={styles.container}>
        <InlineError message="Couldn't load your roadmap preview." />
        <Pressable style={styles.cta} onPress={() => router.replace('/(app)/(tabs)')}>
          <Text style={styles.ctaText}>GO HOME</Text>
        </Pressable>
      </View>
    );
  }

  const { roadmap } = detailQuery.data;
  const introText = roadmap.intro?.intro ?? '';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{roadmap.title}</Text>
        <Text style={styles.intro}>{introText}</Text>

        <View style={styles.cover}>
          <View style={styles.coverOrbLeft} />
          <View style={styles.coverOrbCenter} />
          <View style={styles.coverOrbRight} />
          <Text style={styles.coverLabel}>Your learning path is ready</Text>
        </View>

        <Text style={styles.sectionHeading}>What you will achieve</Text>
        <View style={styles.bulletList}>
          {achievements.map((item) => (
            <View key={`${item.bold}-${item.rest}`} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bulletBold}>{item.bold}</Text>
                {item.rest ? ` ${item.rest}` : ''}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Pressable style={styles.cta} onPress={() => void handleGoToRoadmap()}>
        <Text style={styles.ctaText}>GO TO YOUR ROADMAP</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: onboardingColors.background,
    flex: 1,
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    color: onboardingColors.text,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  intro: {
    color: onboardingColors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  cover: {
    alignItems: 'center',
    backgroundColor: '#F3F0E8',
    borderRadius: radii.card,
    height: 220,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  coverOrbLeft: {
    backgroundColor: '#E07A5F',
    borderRadius: 40,
    height: 80,
    left: 36,
    opacity: 0.85,
    position: 'absolute',
    top: 56,
    width: 80,
  },
  coverOrbCenter: {
    backgroundColor: onboardingColors.primary,
    borderRadius: 48,
    height: 96,
    opacity: 0.9,
    position: 'absolute',
    top: 48,
    width: 96,
  },
  coverOrbRight: {
    backgroundColor: '#3D8B8B',
    borderRadius: 36,
    height: 72,
    opacity: 0.85,
    position: 'absolute',
    right: 40,
    top: 64,
    width: 72,
  },
  coverLabel: {
    bottom: 20,
    color: onboardingColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    position: 'absolute',
  },
  sectionHeading: {
    color: onboardingColors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  bulletList: {
    gap: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bulletDot: {
    color: onboardingColors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  bulletText: {
    color: onboardingColors.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  bulletBold: {
    fontWeight: '700',
  },
  cta: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.card,
    paddingVertical: spacing.md,
  },
  ctaText: {
    color: onboardingColors.primaryText,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
