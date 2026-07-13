import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BottomSheetOrModal } from '@/components/BottomSheetOrModal';
import { SocialPlatformIcon, SOCIAL_PLATFORM_BRAND } from '@/components/icons/SocialPlatformIcons';
import { onboardingColors } from '@/constants/onboardingTokens';
import { fonts, radii, spacing } from '@/constants/tokens';
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
    <BottomSheetOrModal
      visible={visible}
      onClose={onClose}
      maxHeight="88%"
      sheetStyle={styles.sheet}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Edit bio & links</Text>
        <Pressable onPress={onClose}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={onboardingColors.primaryText} />
      ) : (
        <ScrollView
          contentContainerStyle={{ gap: spacing.md, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
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
          {links.map((link) => {
            const brand = SOCIAL_PLATFORM_BRAND[link.platform];
            return (
              <View key={link.id} style={styles.linkRow}>
                <View style={[styles.linkLogo, { backgroundColor: brand.bg }]}>
                  <SocialPlatformIcon platform={link.platform} size={16} />
                </View>
                <Text style={styles.linkText} numberOfLines={1}>
                  {platformLabel(link.platform)} · {link.handle || link.url}
                </Text>
                <Pressable onPress={() => void removeLink(link.id)}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
            );
          })}
          <View style={styles.platformRow}>
            {SOCIAL_PLATFORMS.map((p) => {
              const taken =
                p.id !== 'other' && links.some((link) => link.platform === p.id);
              const brand = SOCIAL_PLATFORM_BRAND[p.id];
              return (
                <Pressable
                  key={p.id}
                  style={[
                    styles.platformChip,
                    { backgroundColor: brand.bg },
                    platform === p.id && styles.platformChipActive,
                    taken && styles.platformChipTaken,
                  ]}
                  disabled={taken}
                  onPress={() => setPlatform(p.id)}
                >
                  <View style={styles.platformLogo}>
                    <SocialPlatformIcon
                      platform={p.id}
                      size={16}
                      color={taken ? '#9CA3AF' : brand.color}
                    />
                  </View>
                  <Text
                    style={[
                      styles.platformText,
                      platform === p.id && styles.platformTextActive,
                      taken && styles.platformTextTaken,
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
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
    </BottomSheetOrModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: onboardingColors.background,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: onboardingColors.text,
    fontFamily: fonts.display,
    fontSize: 18,
  },
  close: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.bodyBold,
  },
  label: {
    color: onboardingColors.text,
    fontFamily: fonts.bodyBold,
  },
  bioInput: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: onboardingColors.text,
    fontFamily: fonts.body,
    minHeight: 96,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  counter: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.body,
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
  linkLogo: {
    alignItems: 'center',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  linkText: {
    color: onboardingColors.text,
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  remove: {
    color: '#B42318',
    fontFamily: fonts.bodyBold,
  },
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformChip: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  platformLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformChipActive: {
    borderColor: onboardingColors.primaryBorder,
  },
  platformChipTaken: {
    opacity: 0.45,
  },
  platformText: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  platformTextActive: {
    color: onboardingColors.primaryText,
  },
  platformTextTaken: {
    color: onboardingColors.textMuted,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: onboardingColors.text,
    fontFamily: fonts.body,
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
    fontFamily: fonts.bodyBold,
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
    fontFamily: fonts.bodyBold,
  },
  error: {
    color: '#B42318',
    fontFamily: fonts.bodySemiBold,
  },
});
