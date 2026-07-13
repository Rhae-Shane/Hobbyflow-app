import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PostTagPicker } from '@/components/feed/PostTagPicker';
import { learnInPublic } from '@/constants/learnInPublic';
import { theme } from '@/constants/theme';
import { spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { createPost, validateMediaDraft } from '@/services/posts';
import { useUserStore } from '@/store/useUserStore';
import {
  MAX_CAPTION_LENGTH,
  MAX_MEDIA_PER_POST,
  type LocalMediaDraft,
  type PostHobbyTag,
} from '@/types/post.types';

type Props = {
  availableTags: PostHobbyTag[];
  tagsLoading?: boolean;
  onOpenFilter: () => void;
  onPosted?: () => void;
  onNeedUsername?: () => void;
  onNeedHobby?: () => void;
};

export function FeedComposeCard({
  availableTags,
  tagsLoading = false,
  onOpenFilter,
  onPosted,
  onNeedUsername,
  onNeedHobby,
}: Props) {
  const { user } = useAuth();
  const username = useUserStore((s) => s.username);
  const initial = (username?.replace('@', '') || 'H').charAt(0).toUpperCase();

  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState<LocalMediaDraft[]>([]);
  const [selectedTags, setSelectedTags] = useState<PostHobbyTag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (availableTags.length === 0) {
      setSelectedTags([]);
      return;
    }
    setSelectedTags((prev) => {
      if (prev.length > 0) {
        const keys = new Set(
          availableTags.map((t) => `${t.source}-${t.hobbyId ?? t.name.toLowerCase()}`),
        );
        const kept = prev.filter((t) =>
          keys.has(`${t.source}-${t.hobbyId ?? t.name.toLowerCase()}`),
        );
        return kept.length > 0 ? kept : [availableTags[0]];
      }
      return [availableTags[0]];
    });
  }, [availableTags]);

  const canPost = useMemo(
    () =>
      Boolean(caption.trim() || media.length) &&
      selectedTags.length >= 1 &&
      availableTags.length >= 1 &&
      !submitting &&
      Boolean(username) &&
      Boolean(user?.id),
    [
      availableTags.length,
      caption,
      media.length,
      selectedTags.length,
      submitting,
      user?.id,
      username,
    ],
  );

  const guardPosting = (): boolean => {
    if (!username) {
      onNeedUsername?.();
      return false;
    }
    if (availableTags.length === 0) {
      onNeedHobby?.();
      return false;
    }
    return true;
  };

  const addDraft = (draft: LocalMediaDraft) => {
    const validation = validateMediaDraft(draft);
    if (validation) {
      setError(validation);
      return;
    }
    setMedia((prev) => {
      if (prev.length >= MAX_MEDIA_PER_POST) {
        setError(`You can attach up to ${MAX_MEDIA_PER_POST} items.`);
        return prev;
      }
      setError(null);
      return [...prev, draft];
    });
    setExpanded(true);
  };

  const pickMedia = async (mediaTypes: Array<'images' | 'videos'>) => {
    if (!guardPosting()) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsMultipleSelection: true,
      quality: 0.85,
      videoMaxDuration: 180,
    });
    if (result.canceled) return;
    for (const asset of result.assets) {
      const kind = asset.type === 'video' ? 'video' : 'image';
      addDraft({
        localUri: asset.uri,
        kind,
        mimeType: asset.mimeType ?? (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
        fileName: asset.fileName ?? `${kind}.${kind === 'video' ? 'mp4' : 'jpg'}`,
        fileSize: asset.fileSize ?? 0,
        width: asset.width,
        height: asset.height,
        durationMs: asset.duration != null ? Math.round(asset.duration * 1000) : undefined,
      });
    }
  };

  const resetDraft = () => {
    setCaption('');
    setMedia([]);
    setError(null);
    setProgress(null);
    setExpanded(false);
    if (availableTags.length > 0) setSelectedTags([availableTags[0]]);
  };

  const onSubmit = async () => {
    if (!guardPosting()) return;
    if (!user?.id || !canPost) {
      if (!caption.trim() && media.length === 0) {
        setExpanded(true);
        setError('Add a caption or photo to post.');
      }
      return;
    }
    setSubmitting(true);
    setError(null);
    setProgress(media.length ? `Uploading 0/${media.length}` : 'Posting…');
    try {
      await createPost({
        authorId: user.id,
        caption,
        media,
        tags: selectedTags,
        onProgress: (done, total) => setProgress(`Uploading ${done}/${total}`),
      });
      resetDraft();
      onPosted?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  const showDetails = expanded || media.length > 0 || caption.length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <Pressable
          style={styles.inputPill}
          onPress={() => {
            if (!guardPosting()) return;
            setExpanded(true);
          }}
        >
          <TextInput
            style={styles.input}
            placeholder={learnInPublic.composePlaceholder}
            placeholderTextColor={theme.colors.textMuted}
            value={caption}
            onChangeText={(text) => {
              setCaption(text);
              if (text.length > 0) setExpanded(true);
            }}
            onFocus={() => {
              if (!guardPosting()) return;
              setExpanded(true);
            }}
            multiline
            maxLength={MAX_CAPTION_LENGTH}
            editable={Boolean(username) && availableTags.length > 0}
          />
          <Ionicons name="happy-outline" size={20} color={theme.colors.textMuted} />
        </Pressable>

        <Pressable
          style={styles.filterBtn}
          onPress={onOpenFilter}
          accessibilityRole="button"
          accessibilityLabel="Filter feed by hobby"
        >
          <Ionicons name="options-outline" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      {showDetails ? (
        <View style={styles.details}>
          {tagsLoading ? (
            <ActivityIndicator color={theme.colors.text} />
          ) : (
            <PostTagPicker
              available={availableTags}
              selected={selectedTags}
              onChange={setSelectedTags}
            />
          )}

          {media.length > 0 ? (
            <View style={styles.previewRow}>
              {media.map((item, index) => (
                <View key={`${item.localUri}-${index}`} style={styles.previewItem}>
                  {item.kind === 'image' ? (
                    <Image source={{ uri: item.localUri }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.previewBadge}>
                      <Text style={styles.previewBadgeText}>
                        {item.kind === 'video' ? 'VIDEO' : 'AUDIO'}
                      </Text>
                    </View>
                  )}
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => setMedia((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Text style={styles.removeText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {progress ? <Text style={styles.progress}>{progress}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      ) : null}

      <View style={styles.bottomRow}>
        <View style={styles.actions}>
          <Pressable
            style={styles.chip}
            onPress={() => void pickMedia(['images'])}
            accessibilityLabel="Add photo"
          >
            <Ionicons name="image-outline" size={16} color={theme.colors.text} />
            <Text style={styles.chipText}>Photo</Text>
          </Pressable>
          <Pressable
            style={styles.chip}
            onPress={() => void pickMedia(['videos'])}
            accessibilityLabel="Add video"
          >
            <Ionicons name="videocam-outline" size={16} color={theme.colors.text} />
            <Text style={styles.chipText}>Video</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.postBtn, (!canPost || submitting) && styles.postBtnDisabled]}
          onPress={() => void onSubmit()}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Post"
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.postBtnText}>{learnInPublic.composeCta}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    elevation: 2,
    gap: spacing.md,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: theme.shadow.offsetY },
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.navActiveSoft,
    borderRadius: theme.radii.avatar,
    height: 42,
    justifyContent: 'center',
    marginTop: 1,
    width: 42,
  },
  avatarText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  inputPill: {
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    maxHeight: 96,
    minHeight: 24,
    padding: 0,
    textAlignVertical: 'top',
  },
  filterBtn: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  details: {
    gap: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  previewItem: {
    position: 'relative',
  },
  previewImage: {
    borderRadius: 12,
    height: 72,
    width: 72,
  },
  previewBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.navActiveSoft,
    borderRadius: 12,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  previewBadgeText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  removeBtn: {
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -4,
    top: -4,
    width: 20,
  },
  removeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    lineHeight: 18,
  },
  progress: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    flexShrink: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: theme.radii.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  chipText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  postBtn: {
    alignItems: 'center',
    backgroundColor: theme.colors.navActive,
    borderRadius: 14,
    justifyContent: 'center',
    minWidth: 72,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  postBtnDisabled: {
    opacity: 0.45,
  },
  postBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
