import { useCallback, useEffect, useRef, useState } from 'react';
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
import { listFeed } from '@/services/posts';
import { searchHobbyTags, searchProfiles } from '@/services/profileSearch';
import { useGamificationStore } from '@/store/useGamificationStore';
import type { HobbyTagSearchHit, ProfileSearchHit } from '@/types/gamification.types';
import type { FeedPost } from '@/types/post.types';

type SearchSection = 'people' | 'hobbies' | 'posts';

export function ProfileSearchScreen() {
  const router = useRouter();
  const leagues = useGamificationStore((s) => s.leagues);
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<SearchSection>('people');
  const [people, setPeople] = useState<ProfileSearchHit[]>([]);
  const [hobbies, setHobbies] = useState<HobbyTagSearchHit[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (q.length < 2) {
      setPeople([]);
      setHobbies([]);
      setPosts([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [peopleHits, hobbyHits] = await Promise.all([
        searchProfiles(q),
        searchHobbyTags(q),
      ]);
      setPeople(peopleHits);
      setHobbies(hobbyHits);

      const primaryHobby = hobbyHits[0];
      if (primaryHobby) {
        const postHits = await listFeed({
          limit: 15,
          viewerScoped: false,
          tagFilter: primaryHobby.name,
        });
        setPosts(postHits);
      } else {
        const tagFromPeople = peopleHits
          .flatMap((p) => p.hobbyTags ?? [])
          .find((t) => t.name.toLowerCase().includes(q.toLowerCase()));
        if (tagFromPeople) {
          const postHits = await listFeed({
            limit: 15,
            viewerScoped: false,
            tagFilter: tagFromPeople.name,
          });
          setPosts(postHits);
        } else {
          setPosts([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setPeople([]);
      setHobbies([]);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onChangeQuery = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(text);
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const openHobby = (hobby: HobbyTagSearchHit) => {
    router.push({
      pathname: '/(app)/(tabs)/feed',
      params: {
        tag: hobby.name,
        hobbyId: hobby.hobbyId != null ? String(hobby.hobbyId) : '',
      },
    } as never);
  };

  const listData =
    section === 'people' ? people : section === 'hobbies' ? hobbies : posts;

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
          placeholder="Search people or hobbies"
          placeholderTextColor={onboardingColors.textMuted}
          value={query}
          onChangeText={onChangeQuery}
        />
      </View>

      <View style={styles.tabs}>
        {(
          [
            ['people', `People (${people.length})`],
            ['hobbies', `Hobbies (${hobbies.length})`],
            ['posts', `Posts (${posts.length})`],
          ] as const
        ).map(([id, label]) => (
          <Pressable
            key={id}
            style={[styles.tab, section === id && styles.tabActive]}
            onPress={() => setSection(id)}
          >
            <Text style={[styles.tabText, section === id && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={onboardingColors.primaryText} style={{ marginTop: 24 }} />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={listData as never[]}
        keyExtractor={(item, index) => {
          if (section === 'people') return (item as ProfileSearchHit).userId;
          if (section === 'hobbies') {
            const h = item as HobbyTagSearchHit;
            return `${h.source}-${h.hobbyId ?? h.name}`;
          }
          return (item as FeedPost).id ?? String(index);
        }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 24, gap: 8 }}
        ListEmptyComponent={
          !loading && query.trim().length >= 2 ? (
            <Text style={styles.empty}>No results.</Text>
          ) : (
            <Text style={styles.empty}>Type at least 2 characters.</Text>
          )
        }
        renderItem={({ item }) => {
          if (section === 'people') {
            const hit = item as ProfileSearchHit;
            return (
              <Pressable
                style={styles.row}
                onPress={() => router.push(`/(app)/u/${hit.username}` as never)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{hit.username.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.body}>
                  <Text style={styles.name}>@{hit.username}</Text>
                  <Text style={styles.meta}>
                    Rating {hit.rating} · {hit.currentStreak}d streak
                  </Text>
                  {hit.hobbyTags?.length ? (
                    <Text style={styles.tags} numberOfLines={1}>
                      {hit.hobbyTags.map((t) => t.name).join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <LeagueBadge leagueId={hit.leagueId} leagues={leagues} compact />
              </Pressable>
            );
          }

          if (section === 'hobbies') {
            const hobby = item as HobbyTagSearchHit;
            return (
              <Pressable style={styles.row} onPress={() => openHobby(hobby)}>
                <View style={[styles.avatar, styles.hobbyAvatar]}>
                  <Text style={styles.avatarText}>{hobby.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.body}>
                  <Text style={styles.name}>{hobby.name}</Text>
                  <Text style={styles.meta}>
                    {hobby.source === 'catalog' ? 'Catalog hobby' : 'Custom tag'}
                  </Text>
                </View>
              </Pressable>
            );
          }

          const post = item as FeedPost;
          return (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/(app)/u/${post.username}` as never)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{post.username.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.body}>
                <Text style={styles.name}>@{post.username}</Text>
                <Text style={styles.meta} numberOfLines={2}>
                  {post.caption || post.tags.map((t) => t.name).join(' · ') || 'Media post'}
                </Text>
              </View>
            </Pressable>
          );
        }}
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
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  tab: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabActive: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
  },
  tabText: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: onboardingColors.primaryText,
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
  hobbyAvatar: {
    backgroundColor: '#E8F6FE',
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
  tags: {
    color: onboardingColors.primaryText,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
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
