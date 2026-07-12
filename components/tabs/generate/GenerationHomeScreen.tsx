import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScreenShell, TAB_SCROLL_BOTTOM_INSET } from '@/components/ui/ScreenShell';
import {
  GENERATION_SUGGESTIONS,
  type GenerationSuggestion,
} from '@/components/tabs/generate/generationSuggestions';
import { dashboardColors, dashboardRadii, hobbyBlockPalette } from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';

type Props = {
  onStart: (prompt: string) => void;
};

function SuggestionCard({
  item,
  index,
  onPress,
}: {
  item: GenerationSuggestion;
  index: number;
  onPress: () => void;
}) {
  const wash = hobbyBlockPalette[index % hobbyBlockPalette.length].background;
  return (
    <Pressable
      style={[styles.card, { backgroundColor: wash }]}
      onPress={onPress}
      accessibilityLabel={item.title}
    >
      <View style={styles.cardArt}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
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
  const [draft, setDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onStart(text);
  };

  return (
    <ScreenShell style={{ paddingBottom: TAB_SCROLL_BOTTOM_INSET - 16 }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>HobbyFlow</Text>
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
          {GENERATION_SUGGESTIONS.map((item, index) => (
            <SuggestionCard
              key={item.id}
              item={item}
              index={index}
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
          placeholderTextColor={dashboardColors.textMuted}
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
            style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
            accessibilityLabel="Start"
            onPress={submit}
            testID="generation-home-send"
          >
            <Text style={styles.sendBtnText}>{draft.trim() ? '→' : '🎙'}</Text>
          </Pressable>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  eyebrow: {
    color: dashboardColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  title: {
    color: dashboardColors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    color: dashboardColors.textMuted,
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
    borderRadius: dashboardRadii.block,
    overflow: 'hidden',
    width: 200,
  },
  cardArt: {
    height: 120,
    overflow: 'hidden',
  },
  cardImage: {
    height: '100%',
    width: '100%',
  },
  cardBody: {
    gap: 8,
    padding: spacing.md,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: dashboardRadii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    color: dashboardColors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    color: dashboardColors.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    minHeight: 66,
  },
  cardAuthor: {
    color: dashboardColors.textMuted,
    fontSize: 13,
  },
  composer: {
    backgroundColor: dashboardColors.surface,
    borderColor: 'rgba(20,20,20,0.06)',
    borderRadius: dashboardRadii.block,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
    shadowColor: '#141414',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  input: {
    color: dashboardColors.text,
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
    backgroundColor: dashboardColors.background,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  iconBtnText: {
    color: dashboardColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sendBtn: {
    alignItems: 'center',
    backgroundColor: dashboardColors.cta,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendBtnText: {
    color: dashboardColors.ctaText,
    fontSize: 16,
    fontWeight: '700',
  },
});
