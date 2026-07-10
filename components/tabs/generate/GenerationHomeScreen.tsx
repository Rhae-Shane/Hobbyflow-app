import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FLOATING_TAB_BAR_HEIGHT } from '@/components/navigation/FloatingTabBar';
import {
  GENERATION_SUGGESTIONS,
  type GenerationSuggestion,
} from '@/components/tabs/generate/generationSuggestions';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';

type Props = {
  onStart: (prompt: string) => void;
};

function SuggestionCard({
  item,
  onPress,
}: {
  item: GenerationSuggestion;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityLabel={item.title}>
      <View style={[styles.cardArt, { backgroundColor: item.accent }]}>
        <View style={styles.cardArtBlock} />
        <View style={[styles.cardArtBlock, styles.cardArtBlockSmall]} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={3}>
          {item.title}
        </Text>
        <Text style={styles.cardAuthor}>{item.author}</Text>
      </View>
    </Pressable>
  );
}

export function GenerationHomeScreen({ onStart }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onStart(text);
  };

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: FLOATING_TAB_BAR_HEIGHT + Math.max(insets.bottom, 8),
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>What do you want to learn?</Text>
        <Text style={styles.subtitle}>
          Tell me what you&apos;re curious about, and I&apos;ll create a personalized roadmap for
          you
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsRow}
          style={styles.cardsScroll}
        >
          {GENERATION_SUGGESTIONS.map((item) => (
            <SuggestionCard
              key={item.id}
              item={item}
              onPress={() => onStart(item.prompt)}
            />
          ))}
        </ScrollView>
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="I want to learn about..."
          placeholderTextColor={onboardingColors.textMuted}
          style={styles.input}
          multiline
          onSubmitEditing={submit}
          returnKeyType="send"
          blurOnSubmit
          testID="generation-home-input"
        />
        <View style={styles.composerActions}>
          <Pressable style={styles.iconBtn} accessibilityLabel="Upload" disabled>
            <Text style={styles.iconBtnText}>↑</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} accessibilityLabel="Browse ideas" disabled>
            <Text style={styles.iconBtnText}>☰</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable
            style={[styles.iconBtn, draft.trim() ? styles.iconBtnActive : null]}
            accessibilityLabel="Start"
            onPress={submit}
            testID="generation-home-send"
          >
            <Text style={styles.iconBtnText}>{draft.trim() ? '→' : '🎙'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: onboardingColors.background,
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  scroll: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    color: onboardingColors.text,
    fontSize: 30,
    fontWeight: '800',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: onboardingColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  cardsScroll: {
    marginTop: spacing.sm,
  },
  cardsRow: {
    gap: spacing.md,
    paddingRight: spacing.md,
    paddingVertical: spacing.sm,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    width: 200,
  },
  cardArt: {
    height: 120,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  cardArtBlock: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 8,
    height: 36,
    marginBottom: 8,
    width: '70%',
  },
  cardArtBlockSmall: {
    height: 24,
    width: '45%',
  },
  cardBody: {
    gap: 8,
    padding: spacing.md,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F0E8',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    color: onboardingColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    minHeight: 66,
  },
  cardAuthor: {
    color: onboardingColors.textMuted,
    fontSize: 13,
  },
  composer: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  input: {
    color: onboardingColors.text,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  composerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 1,
    height: 42,
    justifyContent: 'center',
    shadowColor: '#2C2416',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    width: 42,
  },
  iconBtnActive: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
  },
  iconBtnText: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
