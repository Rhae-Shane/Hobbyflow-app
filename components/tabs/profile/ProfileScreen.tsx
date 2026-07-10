import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InlineError } from '@/components/ui/InlineError';
import { FLOATING_TAB_BAR_HEIGHT } from '@/components/navigation/FloatingTabBar';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { signOut } from '@/lib/auth';
import { toAuthError } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useUserStore } from '@/store/useUserStore';

const PROGRESS_LINKS = [
  { id: 'weekly', label: 'Weekly Report', icon: '📅' },
  { id: 'stats', label: 'Learning Stats', icon: '📊' },
  { id: 'courses', label: 'Roadmap Stats', icon: '📖' },
] as const;

export function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const profile = usePlanStore((s) => s.profile);
  const streakDays = usePlanStore((s) => s.streakDays);
  const clearSession = usePlanStore((s) => s.clearSession);
  const clearPreferencesSession = usePreferencesStore((s) => s.clearSession);
  const clearUserSession = useUserStore((s) => s.clearSession);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const displayName = user?.email?.split('@')[0] || profile?.hobby || 'Learner';
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);
    try {
      await signOut();
      clearSession();
      clearPreferencesSession();
      clearUserSession();
      router.replace('/(auth)');
    } catch (error) {
      setSignOutError(toAuthError(error).message);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingBottom: FLOATING_TAB_BAR_HEIGHT + insets.bottom + 24,
        paddingHorizontal: spacing.md,
        gap: spacing.md,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Pressable
          style={styles.settingsBtn}
          onPress={() => router.push('/(app)/preferences' as never)}
          accessibilityLabel="Settings"
        >
          <Text style={styles.settingsGlyph}>⚙</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <View style={styles.statRow}>
          <Text style={styles.statItem}>🔥 {streakDays} Days</Text>
          <View style={styles.statDivider} />
          <Text style={styles.statItem}>★ 0 XP</Text>
        </View>
        <Pressable style={styles.editBtn} onPress={() => router.push('/(app)/preferences' as never)}>
          <Text style={styles.editText}>EDIT</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>My Progress</Text>
      <View style={styles.listCard}>
        {PROGRESS_LINKS.map((item, index) => (
          <Pressable
            key={item.id}
            style={[styles.listRow, index < PROGRESS_LINKS.length - 1 && styles.listRowBorder]}
            onPress={() => router.push('/(app)/(tabs)/courses' as never)}
          >
            <Text style={styles.listIcon}>{item.icon}</Text>
            <Text style={styles.listLabel}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Learning</Text>
      <View style={styles.listCard}>
        <View style={styles.learningPlaceholder} />
        <Text style={styles.learningHint}>Saved notes and highlights will appear here.</Text>
      </View>

      {signOutError ? <InlineError message={signOutError} /> : null}
      <Pressable style={styles.signOut} onPress={handleSignOut} disabled={isSigningOut}>
        <Text style={styles.signOutText}>{isSigningOut ? 'Signing out…' : 'Sign out'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: onboardingColors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: onboardingColors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  settingsBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  settingsGlyph: {
    fontSize: 18,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#F7F3EA',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  avatarText: {
    color: onboardingColors.primaryText,
    fontSize: 28,
    fontWeight: '800',
  },
  name: {
    color: onboardingColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  statRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  statDivider: {
    backgroundColor: onboardingColors.border,
    height: 16,
    width: 1,
  },
  editBtn: {
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginTop: spacing.xs,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  editText: {
    color: onboardingColors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  listRowBorder: {
    borderBottomColor: onboardingColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listIcon: {
    fontSize: 18,
    width: 24,
  },
  listLabel: {
    color: onboardingColors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  chevron: {
    color: onboardingColors.textMuted,
    fontSize: 22,
  },
  learningPlaceholder: {
    backgroundColor: '#EFEAE0',
    borderRadius: 12,
    height: 72,
    margin: spacing.md,
  },
  learningHint: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  signOut: {
    alignItems: 'center',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
  },
  signOutText: {
    color: onboardingColors.text,
    fontWeight: '700',
  },
});
