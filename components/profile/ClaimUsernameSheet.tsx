import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: onboardingColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  title: {
    color: onboardingColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  sub: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
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
    borderRadius: radii.pill,
    marginTop: spacing.sm,
    paddingVertical: 14,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: onboardingColors.primaryText,
    fontWeight: '800',
  },
  cancel: {
    color: onboardingColors.textMuted,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
