import { useEffect, useMemo, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PostTagPicker } from '@/components/feed/PostTagPicker';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { createPost, validateMediaDraft } from '@/services/posts';
import { fetchOwnHobbyTags } from '@/services/profileSearch';
import { useUserStore } from '@/store/useUserStore';
import {
  MAX_CAPTION_LENGTH,
  MAX_MEDIA_PER_POST,
  type LocalMediaDraft,
  type PostHobbyTag,
} from '@/types/post.types';

export function PostComposer() {
  const router = useRouter();
  const { user } = useAuth();
  const username = useUserStore((s) => s.username);
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState<LocalMediaDraft[]>([]);
  const [availableTags, setAvailableTags] = useState<PostHobbyTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<PostHobbyTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setTagsLoading(true);
    void fetchOwnHobbyTags(user.id)
      .then((tags) => {
        if (cancelled) return;
        setAvailableTags(tags);
        if (tags.length > 0) {
          setSelectedTags([tags[0]]);
        }
      })
      .finally(() => {
        if (!cancelled) setTagsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const canPost = useMemo(
    () =>
      Boolean(caption.trim() || media.length) &&
      selectedTags.length >= 1 &&
      availableTags.length >= 1 &&
      !submitting &&
      Boolean(username),
    [availableTags.length, caption, media.length, selectedTags.length, submitting, username],
  );

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
  };

  const pickLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
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

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (result.canceled) return;
    for (const asset of result.assets) {
      addDraft({
        localUri: asset.uri,
        kind: 'audio',
        mimeType: asset.mimeType ?? 'audio/mpeg',
        fileName: asset.name,
        fileSize: asset.size ?? 0,
      });
    }
  };

  const onSubmit = async () => {
    if (!user?.id || !canPost) return;
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
      router.back();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  if (!username) {
    return (
      <View style={styles.root}>
        <Text style={styles.blocked}>Claim a username before posting.</Text>
        <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!tagsLoading && availableTags.length === 0) {
    return (
      <View style={styles.root}>
        <Text style={styles.blocked}>
          Add a hobby to your profile before posting. Create a roadmap to get hobby tags.
        </Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.replace('/(app)/roadmap-creation' as never)}
        >
          <Text style={styles.primaryBtnText}>Create a roadmap</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>New post</Text>
        <Pressable
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          disabled={!canPost}
          onPress={() => void onSubmit()}
        >
          {submitting ? (
            <ActivityIndicator color={onboardingColors.primaryText} />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </Pressable>
      </View>

      <TextInput
        style={styles.caption}
        placeholder="Share your hobby progress…"
        placeholderTextColor={onboardingColors.textMuted}
        multiline
        maxLength={MAX_CAPTION_LENGTH}
        value={caption}
        onChangeText={setCaption}
      />
      <Text style={styles.counter}>
        {caption.length}/{MAX_CAPTION_LENGTH}
      </Text>

      {tagsLoading ? (
        <ActivityIndicator color={onboardingColors.primaryText} />
      ) : (
        <PostTagPicker
          available={availableTags}
          selected={selectedTags}
          onChange={setSelectedTags}
        />
      )}

      <View style={styles.attachRow}>
        <Pressable style={styles.attachBtn} onPress={() => void pickLibrary()}>
          <Text style={styles.attachText}>Photo / Video</Text>
        </Pressable>
        <Pressable style={styles.attachBtn} onPress={() => void pickAudio()}>
          <Text style={styles.attachText}>Audio</Text>
        </Pressable>
      </View>

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

      {progress ? <Text style={styles.progress}>{progress}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: onboardingColors.background,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: 48,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancel: {
    color: onboardingColors.textMuted,
    fontWeight: '700',
  },
  title: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  postBtn: {
    backgroundColor: onboardingColors.primary,
    borderColor: onboardingColors.primaryBorder,
    borderRadius: radii.pill,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  postBtnDisabled: {
    opacity: 0.45,
  },
  postBtnText: {
    color: onboardingColors.primaryText,
    fontWeight: '800',
    textAlign: 'center',
  },
  caption: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: onboardingColors.text,
    fontSize: 16,
    minHeight: 140,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  counter: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  attachRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  attachBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  attachText: {
    color: onboardingColors.text,
    fontWeight: '700',
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
    height: 88,
    width: 88,
  },
  previewBadge: {
    alignItems: 'center',
    backgroundColor: '#E8F6FE',
    borderColor: onboardingColors.primaryBorder,
    borderRadius: 12,
    borderWidth: 1,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  previewBadgeText: {
    color: onboardingColors.primaryText,
    fontSize: 12,
    fontWeight: '800',
  },
  removeBtn: {
    alignItems: 'center',
    backgroundColor: '#2C2416',
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
    color: onboardingColors.textMuted,
    fontWeight: '600',
  },
  error: {
    color: '#B42318',
    fontWeight: '600',
  },
  blocked: {
    color: onboardingColors.text,
    fontSize: 16,
    marginTop: 48,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
  },
  primaryBtn: {
    alignSelf: 'center',
    backgroundColor: onboardingColors.primary,
    borderColor: onboardingColors.primaryBorder,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: onboardingColors.primaryText,
    fontWeight: '800',
  },
  secondaryBtn: {
    alignSelf: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
  },
  secondaryText: {
    color: onboardingColors.primaryText,
    fontWeight: '800',
  },
});
