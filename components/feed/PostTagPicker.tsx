import { Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import type { PostHobbyTag } from '@/types/post.types';
import { MAX_TAGS_PER_POST } from '@/types/post.types';

type Props = {
  available: PostHobbyTag[];
  selected: PostHobbyTag[];
  onChange: (next: PostHobbyTag[]) => void;
};

function tagKey(tag: PostHobbyTag): string {
  return `${tag.source}-${tag.hobbyId ?? tag.name.toLowerCase()}`;
}

function isSelected(selected: PostHobbyTag[], tag: PostHobbyTag): boolean {
  const key = tagKey(tag);
  return selected.some((t) => tagKey(t) === key);
}

export function PostTagPicker({ available, selected, onChange }: Props) {
  if (!available.length) {
    return (
      <Text style={styles.hint}>
        Add a hobby to your profile before posting. Create a roadmap to get tags.
      </Text>
    );
  }

  const toggle = (tag: PostHobbyTag) => {
    if (isSelected(selected, tag)) {
      onChange(selected.filter((t) => tagKey(t) !== tagKey(tag)));
      return;
    }
    if (selected.length >= MAX_TAGS_PER_POST) return;
    onChange([...selected, tag]);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Hobbies</Text>
      <Text style={styles.sub}>
        Select 1–{MAX_TAGS_PER_POST} from your tags ({selected.length} selected).
      </Text>
      <View style={styles.row}>
        {available.map((tag) => {
          const active = isSelected(selected, tag);
          return (
            <Pressable
              key={tagKey(tag)}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggle(tag)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                {tag.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {selected.length === 0 ? (
        <Text style={styles.warn}>Select at least one hobby.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  label: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  sub: {
    color: onboardingColors.textMuted,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    maxWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
  },
  chipText: {
    color: onboardingColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: onboardingColors.primaryText,
  },
  warn: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
