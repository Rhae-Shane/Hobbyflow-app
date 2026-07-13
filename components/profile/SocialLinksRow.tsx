import { Linking, Pressable, Share, StyleSheet, View } from 'react-native';
import {
  SocialPlatformIcon,
  SOCIAL_PLATFORM_BRAND,
} from '@/components/icons/SocialPlatformIcons';
import { platformLabel } from '@/services/socialLinks';
import type { SocialLink } from '@/types/post.types';

type Props = {
  links: SocialLink[];
};

export function SocialLinksRow({ links }: Props) {
  if (!links.length) return null;

  return (
    <View style={styles.row}>
      {links.map((link) => {
        const brand = SOCIAL_PLATFORM_BRAND[link.platform] ?? SOCIAL_PLATFORM_BRAND.other;
        return (
          <Pressable
            key={link.id}
            style={[styles.logoBtn, { backgroundColor: brand.bg }]}
            onPress={() => void Linking.openURL(link.url)}
            onLongPress={() => void Share.share({ message: link.url })}
            accessibilityLabel={`Open ${platformLabel(link.platform)}`}
          >
            <SocialPlatformIcon platform={link.platform} size={18} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  logoBtn: {
    alignItems: 'center',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
