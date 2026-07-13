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
import { KeyboardAware } from '@/components/ui/KeyboardAware';
import { dashboardColors, dashboardRadii } from '@/constants/dashboardTokens';
import { learnInPublic } from '@/constants/learnInPublic';
import { spacing } from '@/constants/tokens';
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
    <KeyboardAware style={styles.root}>
      <Text style={styles.intro}>{learnInPublic.guideline}</Text>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          placeholder={learnInPublic.searchPlaceholder}
          placeholderTextColor={dashboardColors.textMuted}
          value={query}
          onChangeText={onChangeQuery}
          numberOfLines={1}
          returnKeyType="search"
        />
      </View>

      <View style={styles.tabs}>
        {(
          [
            ['people', `${learnInPublic.partnersTab} (${people.length})`],
            ['hobbies', `${learnInPublic.hobbiesTab} (${hobbies.length})`],
            ['posts', `${learnInPublic.workTab} (${posts.length})`],
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
        <ActivityIndicator color={dashboardColors.text} style={{ marginTop: 24 }} />
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
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: dashboardColors.background,
    flex: 1,
  },
  intro: {
    color: dashboardColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  headerWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  searchWrap: {
    paddingHorizontal: spacing.md,
  },
  input: {
    backgroundColor: dashboardColors.surface,
    borderColor: 'rgba(20,20,20,0.06)',
    borderRadius: dashboardRadii.block,
    borderWidth: 1,
    color: dashboardColors.text,
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
    backgroundColor: dashboardColors.surface,
    borderColor: 'rgba(20,20,20,0.06)',
    borderRadius: dashboardRadii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabActive: {
    backgroundColor: '#F3EAF8',
    borderColor: '#D4B8E8',
  },
  tabText: {
    color: dashboardColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: dashboardColors.text,
  },
  row: {
    alignItems: 'center',
    backgroundColor: dashboardColors.surface,
    borderRadius: dashboardRadii.block,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#FFD6A8',
    borderRadius: dashboardRadii.avatar,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  hobbyAvatar: {
    backgroundColor: '#D8EEF8',
  },
  avatarText: {
    color: dashboardColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  body: { flex: 1, gap: 2 },
  name: {
    color: dashboardColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: dashboardColors.textMuted,
    fontSize: 12,
  },
  tags: {
    color: dashboardColors.text,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  empty: {
    color: dashboardColors.textMuted,
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
