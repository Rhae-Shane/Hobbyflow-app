import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BootSpinner } from '@/components/BootSpinner';
import { KeyboardAware } from '@/components/ui/KeyboardAware';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { usePlanStoreHydrated } from '@/hooks/usePlanStoreHydrated';
import { normalizeUsername, validateUsernameFormat } from '@/lib/gamification/constants';
import { getPostAuthRoute, hasCompletedPreferences } from '@/lib/routing';
import { checkUsernameAvailable, claimUsername } from '@/services/profileSearch';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useUserStore } from '@/store/useUserStore';

/**
 * Mandatory username claim right after signup (before preferences / roadmap).
 */
export default function ClaimUsernameScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const username = useUserStore((s) => s.username);
  const setUsername = useUserStore((s) => s.setUsername);
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);
  const userHydrationStatus = useUserStore((s) => s.hydrationStatus);
  const preferences = usePreferencesStore((s) => s.preferences);
  const hobbies = usePlanStore((s) => s.hobbies);
  const storeHydrated = usePlanStoreHydrated();

  const [value, setValue] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeHydrated || userHydrationStatus === 'loading') return;
    if (username) {
      router.replace(
        getPostAuthRoute({
          username,
          completedOnboardingAt,
          hasPreferences: hasCompletedPreferences(preferences),
          hasHobbies: hobbies.length > 0,
        }) as never,
      );
    }
  }, [
    completedOnboardingAt,
    hobbies.length,
    preferences,
    router,
    storeHydrated,
    userHydrationStatus,
    username,
  ]);

  useEffect(() => {
    const next = normalizeUsername(value);
    if (next.length < 2) {
      setAvailable(null);
      setHint(null);
      return;
    }

    const formatError = validateUsernameFormat(next);
    if (formatError) {
      setAvailable(false);
      setHint(formatError);
      return;
    }

    let cancelled = false;
    setChecking(true);
    const timer = setTimeout(() => {
      void checkUsernameAvailable(next).then((result) => {
        if (cancelled) return;
        setChecking(false);
        setAvailable(result.available);
        setHint(result.error ?? (result.available ? 'Available' : 'Taken'));
      });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  const onSubmit = async () => {
    if (!user?.id || !available) return;
    setError(null);
    setSaving(true);
    try {
      const claimed = await claimUsername(user.id, value);
      setUsername(claimed);
      router.replace(
        getPostAuthRoute({
          username: claimed,
          completedOnboardingAt,
          hasPreferences: hasCompletedPreferences(preferences),
          hasHobbies: hobbies.length > 0,
        }) as never,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not claim username');
    } finally {
      setSaving(false);
    }
  };

  if (!storeHydrated || userHydrationStatus === 'loading' || username) {
    return <BootSpinner />;
  }

  return (
    <KeyboardAware style={styles.root}>
      <Text style={styles.brand}>HobbyFlow</Text>
      <Text style={styles.title}>Pick your username</Text>
      <Text style={styles.sub}>
        This is how others find you. You can only set it once for now.
      </Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        placeholder="@username"
        placeholderTextColor={onboardingColors.textMuted}
        value={value}
        onChangeText={setValue}
        maxLength={21}
      />
      <Text
        style={[
          styles.hint,
          available === true && styles.hintOk,
          available === false && styles.hintBad,
        ]}
      >
        {checking ? 'Checking…' : hint ?? ' '}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[styles.cta, (!available || saving) && styles.ctaDisabled]}
        disabled={!available || saving}
        onPress={() => {
          void onSubmit();
        }}
      >
        {saving ? (
          <ActivityIndicator color={onboardingColors.primaryText} />
        ) : (
          <Text style={styles.ctaText}>CONTINUE</Text>
        )}
      </Pressable>
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: onboardingColors.background,
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
  },
  brand: {
    color: onboardingColors.primaryText,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  title: {
    color: onboardingColors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  sub: {
    color: onboardingColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
  },
  hint: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    minHeight: 18,
  },
  hintOk: {
    color: '#059669',
  },
  hintBad: {
    color: '#E11D48',
  },
  error: {
    color: '#E11D48',
    fontSize: 13,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderColor: onboardingColors.primaryBorder,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingVertical: 16,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: onboardingColors.primaryText,
    fontWeight: '800',
  },
});
