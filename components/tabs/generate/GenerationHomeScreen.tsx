import { useCallback, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GENERATION_SUGGESTIONS,
  type GenerationSuggestion,
} from '@/components/tabs/generate/generationSuggestions';
import { ChevronRightIcon, SparkleIcon } from '@/components/icons/AppIcons';
import { FLOATING_TAB_BAR_HEIGHT } from '@/components/navigation/tabBarLayout';
import {
  dashboardColors,
  dashboardRadii,
  hobbyBlockPalette,
} from '@/constants/dashboardTokens';
import { theme } from '@/constants/theme';
import { spacing } from '@/constants/tokens';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';

type Props = {
  onStart: (prompt: string) => void;
};

const GAP = 12;
const CONTENT_PAD = spacing.md;
const TAB_BOTTOM_INSET = FLOATING_TAB_BAR_HEIGHT + 16;
const COMPOSER_HEIGHT = 58;

function SuggestionCard({
  item,
  index,
  width,
  onPress,
}: {
  item: GenerationSuggestion;
  index: number;
  width: number;
  onPress: () => void;
}) {
  const wash = hobbyBlockPalette[index % hobbyBlockPalette.length].background;

  return (
    <Pressable
      style={[styles.card, { backgroundColor: wash, width }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.category}: ${item.title}`}
      testID={`generation-suggestion-${item.id}`}
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
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {item.author}
        </Text>
      </View>
    </Pressable>
  );
}

export function GenerationHomeScreen({ onStart }: Props) {
  const [draft, setDraft] = useState('');
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.round((windowWidth - CONTENT_PAD * 2 - GAP) / 2);
  const [canScrollMore, setCanScrollMore] = useState(true);
  const keyboardOpen = useKeyboardVisible();
  const insets = useSafeAreaInsets();

  /** Above floating tabs when closed; flush on the keyboard when open (WhatsApp-style). */
  const closedLift = TAB_BOTTOM_INSET;
  const openedPad = Math.max(insets.bottom, spacing.sm);

  const updateScrollCue = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const remaining = contentSize.width - layoutMeasurement.width - contentOffset.x;
    setCanScrollMore(remaining > 8);
  }, []);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onStart(text);
  };

  const canSend = Boolean(draft.trim());

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom:
              (keyboardOpen ? openedPad : closedLift) + COMPOSER_HEIGHT + spacing.md,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>HobbyFlow</Text>
          <Text style={styles.title}>What do you want to learn?</Text>
          <Text style={styles.subtitle}>
            Tell me what you&apos;re curious about, and I&apos;ll create a personalized roadmap for
            you
          </Text>
        </View>

        <View style={styles.cardsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={cardWidth + GAP}
            snapToAlignment="start"
            disableIntervalMomentum
            contentContainerStyle={styles.cardsRow}
            onScroll={updateScrollCue}
            onContentSizeChange={() => setCanScrollMore(true)}
            scrollEventThrottle={16}
          >
            {GENERATION_SUGGESTIONS.map((item, index) => (
              <SuggestionCard
                key={item.id}
                item={item}
                index={index}
                width={cardWidth}
                onPress={() => onStart(item.prompt)}
              />
            ))}
          </ScrollView>

          {canScrollMore ? (
            <View style={styles.cue} pointerEvents="none">
              <View style={styles.chevronBubble}>
                <ChevronRightIcon size={16} color={dashboardColors.text} />
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <KeyboardStickyView
        offset={{ closed: 0, opened: 0 }}
        style={styles.sticky}
      >
        <View
          style={[
            styles.composerDock,
            { paddingBottom: keyboardOpen ? openedPad : closedLift },
          ]}
        >
          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="I want to learn about..."
              placeholderTextColor={dashboardColors.textMuted}
              style={styles.input}
              numberOfLines={1}
              onSubmitEditing={submit}
              returnKeyType="send"
              blurOnSubmit
              testID="generation-home-input"
            />
            <Pressable
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              accessibilityLabel="Start"
              onPress={submit}
              disabled={!canSend}
              testID="generation-home-send"
            >
              <SparkleIcon size={18} color={theme.colors.navActiveSoft} />
            </Pressable>
          </View>
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: dashboardColors.background,
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: CONTENT_PAD,
    paddingTop: spacing.sm,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  eyebrow: {
    color: dashboardColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  title: {
    color: dashboardColors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: dashboardColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
    textAlign: 'center',
  },
  cardsWrap: {
    position: 'relative',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: GAP,
    paddingRight: CONTENT_PAD + 8,
    paddingVertical: spacing.xs,
  },
  cue: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  chevronBubble: {
    alignItems: 'center',
    backgroundColor: dashboardColors.surface,
    borderColor: 'rgba(20,20,20,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 4,
    height: 32,
    justifyContent: 'center',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    width: 32,
  },
  card: {
    borderRadius: dashboardRadii.block,
    minHeight: 300,
    overflow: 'hidden',
  },
  cardArt: {
    height: 148,
    overflow: 'hidden',
    width: '100%',
  },
  cardImage: {
    height: '100%',
    width: '100%',
  },
  cardBody: {
    flex: 1,
    gap: 8,
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: dashboardColors.surface,
    borderRadius: dashboardRadii.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  categoryText: {
    color: dashboardColors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    color: dashboardColors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  cardSubtitle: {
    color: dashboardColors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  sticky: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  composerDock: {
    paddingHorizontal: CONTENT_PAD,
  },
  composer: {
    alignItems: 'center',
    backgroundColor: dashboardColors.surface,
    borderColor: 'rgba(20,20,20,0.06)',
    borderRadius: theme.radii.input,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: theme.shadow.offsetY },
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
  },
  input: {
    color: dashboardColors.text,
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 10,
  },
  sendBtn: {
    alignItems: 'center',
    backgroundColor: dashboardColors.cta,
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
});
