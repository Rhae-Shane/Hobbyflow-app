import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LeagueBadge } from '@/components/profile/LeagueBadge';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { normalizeUsername } from '@/lib/gamification/constants';
import { searchProfiles } from '@/services/profileSearch';
import { useGamificationStore } from '@/store/useGamificationStore';
import type { ProfileSearchHit } from '@/types/gamification.types';

export function ProfileSearchScreen() {
  const router = useRouter();
  const leagues = useGamificationStore((s) => s.leagues);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProfileSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (raw: string) => {
    const q = normalizeUsername(raw);
    setQuery(raw);
    if (q.length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const hits = await searchProfiles(q);
      setResults(hits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Text style={styles.backGlyph}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          placeholder="Search @username"
          placeholderTextColor={onboardingColors.textMuted}
          value={query}
          onChangeText={(text) => {
            void runSearch(text);
          }}
        />
      </View>

      {loading ? <ActivityIndicator color={onboardingColors.primaryText} style={{ marginTop: 24 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 24, gap: 8 }}
        ListEmptyComponent={
          !loading && normalizeUsername(query).length >= 2 ? (
            <Text style={styles.empty}>No public profiles found.</Text>
          ) : (
            <Text style={styles.empty}>Type at least 2 characters.</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/(app)/u/${item.username}` as never)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>@{item.username}</Text>
              <Text style={styles.meta}>
                Rating {item.rating} · {item.currentStreak}d streak
              </Text>
            </View>
            <LeagueBadge leagueId={item.leagueId} leagues={leagues} compact />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: onboardingColors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backGlyph: {
    color: onboardingColors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  headerTitle: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: { width: 40 },
  searchWrap: {
    paddingHorizontal: spacing.md,
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
    paddingVertical: 12,
  },
  row: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: onboardingColors.primaryText,
    fontSize: 18,
    fontWeight: '800',
  },
  body: { flex: 1, gap: 2 },
  name: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: onboardingColors.textMuted,
    fontSize: 12,
  },
  empty: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  error: {
    color: '#E11D48',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
