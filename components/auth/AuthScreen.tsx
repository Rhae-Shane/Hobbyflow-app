import { useCallback, useState } from 'react';
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
import { InlineError } from '@/components/ui/InlineError';
import { toAuthError } from '@/lib/errors';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/lib/auth';
import { colors, radii, spacing } from '@/constants/tokens';

type AuthMode = 'sign_in' | 'sign_up';

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetMessages = useCallback(() => {
    setError(null);
    setInfo(null);
  }, []);

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
        <Text style={styles.title}>HobbyFlow</Text>
        <Text style={styles.subtitle}>Sign in to save your roadmap across devices.</Text>

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          autoCapitalize="none"
          autoComplete="password"
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
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
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  switchMode: {
    color: colors.primary,
    fontSize: 14,
    textAlign: 'center',
  },
  error: {
    color: '#DC2626',
    fontSize: 14,
  },
  info: {
    color: colors.success,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
});
