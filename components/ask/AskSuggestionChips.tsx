import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import {
  askCompanionColors,
  askCompanionRadii,
} from '@/constants/askCompanionTokens';
import { spacing } from '@/constants/tokens';
import { hapticSelection } from '@/utils/haptics';

export type AskSuggestion = {
  id: string;
  label: string;
  seedMessage: string | null;
};

type Props = {
  suggestions: AskSuggestion[];
  activeId?: string | null;
  onSelect: (suggestion: AskSuggestion) => void;
};

export function AskSuggestionChips({ suggestions, activeId, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {suggestions.map((item) => {
        const active = item.id === activeId;
        return (
          <Pressable
            key={item.id}
            onPress={() => {
              hapticSelection();
              onSelect(item);
            }}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityLabel={item.label}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: askCompanionColors.surface,
    borderColor: askCompanionColors.chipBorder,
    borderRadius: askCompanionRadii.chip,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: askCompanionColors.chipActive,
    borderColor: askCompanionColors.chipActive,
  },
  chipText: {
    color: askCompanionColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: askCompanionColors.chipActiveText,
  },
});
