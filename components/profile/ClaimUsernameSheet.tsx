import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BottomSheetOrModal } from '@/components/BottomSheetOrModal';
import { onboardingColors } from '@/constants/onboardingTokens';
import { fonts, radii, spacing } from '@/constants/tokens';
import { normalizeUsername, validateUsernameFormat } from '@/lib/gamification/constants';
import { checkUsernameAvailable, claimUsername } from '@/services/profileSearch';
import { useUserStore } from '@/store/useUserStore';

type Props = {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onClaimed: (username: string) => void;
};

export function ClaimUsernameSheet({ visible, userId, onClose, onClaimed }: Props) {
  const setUsername = useUserStore((s) => s.setUsername);
  const [value, setValue] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    const username = normalizeUsername(value);
    if (username.length < 2) {
      setAvailable(null);
      setHint(null);
      return;
    }

    const formatError = validateUsernameFormat(username);
    if (formatError) {
      setAvailable(false);
      setHint(formatError);
      return;
    }

    let cancelled = false;
    setChecking(true);
    const timer = setTimeout(() => {
      void checkUsernameAvailable(username).then((result) => {
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
  }, [value, visible]);

  const onSubmit = async () => {
    setError(null);
    setSaving(true);
    try {
      const username = await claimUsername(userId, value);
      setUsername(username);
      onClaimed(username);
      onClose();
      setValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not claim username');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheetOrModal
      visible={visible}
      onClose={onClose}
      sheetStyle={styles.sheet}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Claim your username</Text>
        <Text style={styles.sub}>This is how others find and share your profile.</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="@username"
          placeholderTextColor={onboardingColors.textMuted}
          value={value}
          onChangeText={setValue}
          maxLength={21}
          numberOfLines={1}
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
            <Text style={styles.ctaText}>CLAIM</Text>
          )}
        </Pressable>
        <Pressable onPress={onClose}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </View>
    </BottomSheetOrModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: onboardingColors.background,
  },
  content: {
    gap: spacing.sm,
  },
  title: {
    color: onboardingColors.text,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  sub: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: onboardingColors.text,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  hint: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.body,
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
    fontFamily: fonts.body,
    fontSize: 13,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.pill,
    marginTop: spacing.sm,
    paddingVertical: 14,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: onboardingColors.primaryText,
    fontFamily: fonts.bodyBold,
  },
  cancel: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.bodySemiBold,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
