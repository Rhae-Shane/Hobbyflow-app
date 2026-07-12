import { Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { platformLabel } from '@/services/socialLinks';
import type { SocialLink } from '@/types/post.types';

const GLYPH: Record<string, string> = {
  instagram: 'IG',
  youtube: 'YT',
  tiktok: 'TT',
  x: 'X',
  linkedin: 'in',
  github: 'GH',
  website: '↗',
  other: '•',
};

type Props = {
  links: SocialLink[];
};

export function SocialLinksRow({ links }: Props) {
  if (!links.length) return null;

  return (
    <View style={styles.row}>
      {links.map((link) => (
        <Pressable
          key={link.id}
          style={styles.chip}
          onPress={() => void Linking.openURL(link.url)}
          onLongPress={() => void Share.share({ message: link.url })}
          accessibilityLabel={`Open ${platformLabel(link.platform)}`}
        >
          <Text style={styles.glyph}>{GLYPH[link.platform] ?? '•'}</Text>
          <Text style={styles.label} numberOfLines={1}>
            {link.handle || platformLabel(link.platform)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  chip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    maxWidth: 160,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  glyph: {
    color: onboardingColors.primaryText,
    fontSize: 11,
    fontWeight: '800',
  },
  label: {
    color: onboardingColors.text,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
  },
});
