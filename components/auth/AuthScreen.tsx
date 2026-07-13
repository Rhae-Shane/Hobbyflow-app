import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { InlineError } from '@/components/ui/InlineError';
import { toAuthError } from '@/lib/errors';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/lib/auth';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';

type AuthMode = 'sign_in' | 'sign_up';

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleEmailAuth = async () => {
    resetMessages();
    setIsSubmitting(true);

    try {
      if (mode === 'sign_in') {
        await signInWithEmail(email.trim(), password);
      } else {
        const session = await signUpWithEmail(email.trim(), password);
        if (!session) {
          setInfo('Check your email to confirm your account, then sign in.');
        }
      }
    } catch (err) {
      const authError = toAuthError(err);
      if (authError.code !== 'AUTH_CANCELLED') {
        setError(authError.userMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    resetMessages();
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      const authError = toAuthError(err);
      if (authError.code !== 'AUTH_CANCELLED') {
        setError(authError.userMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to get started"
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backRow}
        >
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.logoWrap}>
          <BrandLogo size={72} />
        </View>

        <Text style={styles.subtitle}>Sign in to save your roadmap across devices.</Text>

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          autoCapitalize="none"
          autoComplete="password"
          placeholder="Password"
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {error ? <InlineError message={error} /> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <Pressable
          disabled={isSubmitting || !email || !password}
          onPress={handleEmailAuth}
          style={[styles.primaryButton, (isSubmitting || !email || !password) && styles.disabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === 'sign_in' ? 'Sign in with email' : 'Create account'}
            </Text>
          )}
        </Pressable>

        <Pressable
          disabled={isSubmitting}
          onPress={handleGoogleAuth}
          style={[styles.googleButton, isSubmitting && styles.disabled]}
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            resetMessages();
            setMode((current) => (current === 'sign_in' ? 'sign_up' : 'sign_in'));
          }}
        >
          <Text style={styles.switchMode}>
            {mode === 'sign_in'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    elevation: 2,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: theme.shadow.offsetY },
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
  },
  backRow: {
    alignSelf: 'flex-start',
    marginBottom: -spacing.sm,
  },
  backText: {
    color: theme.colors.textMuted,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: theme.radii.input,
    color: theme.colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.cta,
    borderRadius: theme.radii.pill,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: theme.colors.ctaText,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 14,
  },
  googleButtonText: {
    color: theme.colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  switchMode: {
    color: theme.colors.navActive,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    textAlign: 'center',
  },
  info: {
    color: theme.colors.success,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.45,
  },
});
