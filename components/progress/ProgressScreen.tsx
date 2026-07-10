import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { HobbiesList } from '@/components/hobbies/HobbiesList';
import { HobbySwitcher } from '@/components/hobbies/HobbySwitcher';
import { InlineError } from '@/components/ui/InlineError';
import { StreakBadge } from '@/components/progress/StreakBadge';
import { toAuthError } from '@/lib/errors';
import { signOut } from '@/lib/auth';
import { colors, radii, spacing } from '@/constants/tokens';
import {
  getActiveTechniques,
  getEstimatedFinishDays,
  getMasteredCount,
  getRemainingTechniques,
  getSkippedCount,
  usePlanStore,
} from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useUserStore } from '@/store/useUserStore';

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function ProgressScreen() {
  const router = useRouter();
  const plan = usePlanStore((s) => s.plan);
  const hobbies = usePlanStore((s) => s.hobbies);
  const profile = usePlanStore((s) => s.profile);
  const streakDays = usePlanStore((s) => s.streakDays);
  const clearSession = usePlanStore((s) => s.clearSession);
  const clearPreferencesSession = usePreferencesStore((s) => s.clearSession);
  const clearUserSession = useUserStore((s) => s.clearSession);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const techniques = plan?.techniques ?? [];
    const activeCount = getActiveTechniques(techniques).length;
    const masteredCount = getMasteredCount(techniques);
    const remainingCount = getRemainingTechniques(techniques).length;
    const skippedCount = getSkippedCount(techniques);
    const estimatedDays = getEstimatedFinishDays(techniques, profile?.timeBudget);

    return { activeCount, masteredCount, remainingCount, skippedCount, estimatedDays };
  }, [plan?.techniques, profile?.timeBudget]);

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);
    try {
      await signOut();
      clearSession();
      clearPreferencesSession();
      clearUserSession();
      router.replace('/(auth)');
    } catch (err) {
      setSignOutError(toAuthError(err).userMessage);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (hobbies.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Progress</Text>
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>Complete onboarding first — </Text>
          <Link href="/(app)/(tabs)/generate">
            <Text style={styles.emptyLink}>get started.</Text>
          </Link>
        </View>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Progress</Text>
          <StreakBadge days={streakDays} />
        </View>
        <HobbySwitcher />
        <HobbiesList />
        <Pressable
          disabled={isSigningOut}
          onPress={handleSignOut}
          style={[styles.signOutButton, isSigningOut && styles.signOutDisabled]}
        >
          <Text style={styles.signOutText}>{isSigningOut ? 'Signing out…' : 'Sign out'}</Text>
        </Pressable>
        {signOutError ? <InlineError message={signOutError} /> : null}
      </View>
    );
  }

  const finishLabel =
    stats.estimatedDays === 1 ? '1 day' : `${stats.estimatedDays} days`;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Progress</Text>
        <StreakBadge days={streakDays} />
      </View>

      <HobbySwitcher />
      <HobbiesList />

      <View style={styles.statsCard}>
        <StatRow
          label="Mastered"
          value={`${stats.masteredCount} / ${stats.activeCount} active`}
        />
        <StatRow label="Remaining" value={String(stats.remainingCount)} />
        <StatRow label="Skipped" value={String(stats.skippedCount)} />
        <StatRow label="Estimated Finish" value={finishLabel} />
      </View>

      <Pressable
        disabled={isSigningOut}
        onPress={handleSignOut}
        style={[styles.signOutButton, isSigningOut && styles.signOutDisabled]}
      >
        <Text style={styles.signOutText}>{isSigningOut ? 'Signing out…' : 'Sign out'}</Text>
      </Pressable>
      {signOutError ? <InlineError message={signOutError} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  statRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 15,
  },
  statValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  emptyLink: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  signOutDisabled: {
    opacity: 0.6,
  },
  signOutText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
