import { useCallback, useState } from 'react';
import {
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AddHobbyGhostBlock,
  HobbyRoadmapBlock,
  type HobbyBlockProgress,
} from '@/components/home/HobbyRoadmapBlock';
import { ChevronRightIcon } from '@/components/icons/AppIcons';
import { dashboardColors } from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';
import type { RoadmapRow } from '@/types/roadmap.types';

type Props = {
  roadmaps: RoadmapRow[];
  progressById: Record<string, HobbyBlockProgress>;
  onOpen: (roadmapId: string) => void;
  onAddHobby: () => void;
  onSeeAll?: () => void;
};

const GAP = 12;
/** Side padding on the home content container. */
const CONTENT_PAD = spacing.md;

export function HobbyRoadmapBlocks({
  roadmaps,
  progressById,
  onOpen,
  onAddHobby,
  onSeeAll,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const scrollable = roadmaps.length > 2;
  const [canScrollMore, setCanScrollMore] = useState(scrollable);
  // Two cards fit the viewport; extra cards peek so horizontal scroll is obvious.
  const cardWidth = scrollable
    ? Math.round((windowWidth - CONTENT_PAD * 2 - GAP) / 2)
    : undefined;

  const updateScrollCue = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const remaining = contentSize.width - layoutMeasurement.width - contentOffset.x;
    setCanScrollMore(remaining > 8);
  }, []);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.heading}>Hobby roadmaps</Text>
        {roadmaps.length > 2 && onSeeAll ? (
          <Pressable onPress={onSeeAll}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        ) : null}
      </View>

      {scrollable ? (
        <View style={styles.scrollWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={cardWidth! + GAP}
            snapToAlignment="start"
            disableIntervalMomentum
            contentContainerStyle={styles.scrollContent}
            onScroll={updateScrollCue}
            onContentSizeChange={() => setCanScrollMore(true)}
            scrollEventThrottle={16}
          >
            {roadmaps.map((row, index) => (
              <HobbyRoadmapBlock
                key={row.id}
                title={row.title}
                index={index}
                progress={progressById[row.id]}
                ctaLabel={row.status === 'preview' ? 'START' : 'OPEN'}
                onPress={() => onOpen(row.id)}
                width={cardWidth}
              />
            ))}
            <AddHobbyGhostBlock onPress={onAddHobby} width={cardWidth} />
          </ScrollView>

          {canScrollMore ? (
            <View style={styles.cue} pointerEvents="none">
              <View style={styles.chevronBubble}>
                <ChevronRightIcon size={16} color={dashboardColors.text} />
              </View>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.row}>
          {roadmaps.length === 0 ? (
            <AddHobbyGhostBlock onPress={onAddHobby} />
          ) : (
            <>
              {roadmaps.map((row, index) => (
                <HobbyRoadmapBlock
                  key={row.id}
                  title={row.title}
                  index={index}
                  progress={progressById[row.id]}
                  ctaLabel={row.status === 'preview' ? 'START' : 'OPEN'}
                  onPress={() => onOpen(row.id)}
                />
              ))}
              {roadmaps.length === 1 ? <AddHobbyGhostBlock onPress={onAddHobby} /> : null}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.md,
  },
  header: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  heading: {
    color: dashboardColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  seeAll: {
    color: dashboardColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  scrollWrap: {
    position: 'relative',
  },
  scrollContent: {
    flexDirection: 'row',
    gap: GAP,
    paddingRight: CONTENT_PAD + 8,
  },
  cue: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
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
    shadowColor: '#141414',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    width: 32,
  },
});
