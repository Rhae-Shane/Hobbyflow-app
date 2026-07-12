import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import {
  deleteSocialLink,
  fetchSocialLinks,
  platformLabel,
  updateBio,
  upsertSocialLink,
} from '@/services/socialLinks';
import { useUserStore } from '@/store/useUserStore';
import {
  MAX_BIO_LENGTH,
  SOCIAL_PLATFORMS,
  type SocialLink,
  type SocialPlatform,
} from '@/types/post.types';

type Props = {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onSaved?: (links: SocialLink[]) => void;
};

export function EditBioLinksSheet({ visible, userId, onClose, onSaved }: Props) {
  const bio = useUserStore((s) => s.bio);
  const setBio = useUserStore((s) => s.setBio);
  const [draftBio, setDraftBio] = useState(bio);
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [url, setUrl] = useState('');
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setDraftBio(bio);
    setError(null);
    setLoading(true);
    void fetchSocialLinks(userId)
      .then(setLinks)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load links');
      })
      .finally(() => setLoading(false));
  }, [visible, userId, bio]);

  const saveBio = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateBio(userId, draftBio.slice(0, MAX_BIO_LENGTH));
      setBio(draftBio.slice(0, MAX_BIO_LENGTH));
      onSaved?.(links);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save bio');
    } finally {
      setSaving(false);
    }
  };

  const addLink = async () => {
    setError(null);
    try {
      const row = await upsertSocialLink({
        userId,
        platform,
        url,
        handle: handle || null,
      });
      setLinks((prev) => [...prev, row]);
      setUrl('');
      setHandle('');
      onSaved?.([...links, row]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add link');
    }
  };

  const removeLink = async (linkId: string) => {
    try {
      await deleteSocialLink(userId, linkId);
      const next = links.filter((l) => l.id !== linkId);
      setLinks(next);
      onSaved?.(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove link');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit bio & links</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={onboardingColors.primaryText} />
          ) : (
            <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: 24 }}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={styles.bioInput}
                multiline
                maxLength={MAX_BIO_LENGTH}
                value={draftBio}
                onChangeText={setDraftBio}
                placeholder="Tell learners about your hobbies"
                placeholderTextColor={onboardingColors.textMuted}
              />
              <Text style={styles.counter}>
                {draftBio.length}/{MAX_BIO_LENGTH}
              </Text>

              <Text style={styles.label}>Social links</Text>
              {links.map((link) => (
                <View key={link.id} style={styles.linkRow}>
                  <Text style={styles.linkText} numberOfLines={1}>
                    {platformLabel(link.platform)} · {link.handle || link.url}
                  </Text>
                  <Pressable onPress={() => void removeLink(link.id)}>
                    <Text style={styles.remove}>Remove</Text>
                  </Pressable>
                </View>
              ))}

              <View style={styles.platformRow}>
                {SOCIAL_PLATFORMS.map((p) => (
                  <Pressable
                    key={p.id}
                    style={[styles.platformChip, platform === p.id && styles.platformChipActive]}
                    onPress={() => setPlatform(p.id)}
                  >
                    <Text
                      style={[
                        styles.platformText,
                        platform === p.id && styles.platformTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="https://…"
                placeholderTextColor={onboardingColors.textMuted}
                autoCapitalize="none"
                value={url}
                onChangeText={setUrl}
              />
              <TextInput
                style={styles.input}
                placeholder="Handle (optional)"
                placeholderTextColor={onboardingColors.textMuted}
                autoCapitalize="none"
                value={handle}
                onChangeText={setHandle}
              />
              <Pressable style={styles.secondaryBtn} onPress={() => void addLink()}>
                <Text style={styles.secondaryText}>Add link</Text>
              </Pressable>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable style={styles.primaryBtn} onPress={() => void saveBio()} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={onboardingColors.primaryText} />
                ) : (
                  <Text style={styles.primaryText}>Save bio</Text>
                )}
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(44,36,22,0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: onboardingColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  close: {
    color: onboardingColors.textMuted,
    fontWeight: '700',
  },
  label: {
    color: onboardingColors.text,
    fontWeight: '800',
  },
  bioInput: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: onboardingColors.text,
    minHeight: 96,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  counter: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  linkRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  linkText: {
    color: onboardingColors.text,
    flex: 1,
    fontSize: 13,
  },
  remove: {
    color: '#B42318',
    fontWeight: '700',
  },
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformChip: {
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  platformChipActive: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
  },
  platformText: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  platformTextActive: {
    color: onboardingColors.primaryText,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: onboardingColors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  secondaryBtn: {
    alignItems: 'center',
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingVertical: 10,
  },
  secondaryText: {
    color: onboardingColors.text,
    fontWeight: '800',
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderColor: onboardingColors.primaryBorder,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingVertical: 12,
  },
  primaryText: {
    color: onboardingColors.primaryText,
    fontWeight: '800',
  },
  error: {
    color: '#B42318',
    fontWeight: '600',
  },
});
