import { StyleSheet, View } from 'react-native';
import { theme } from '@/constants/theme';

const GRID_SIZE = 36;
const GRID_COLS = 12;
const GRID_ROWS = 24;

type Props = {
  /** 0–1 opacity of the grid lines. */
  opacity?: number;
};

/** Subtle graph-paper background used on Explore / Generation / Stage. */
export function GraphPaperGrid({ opacity = 0.45 }: Props) {
  return (
    <View style={[styles.layer, { opacity }]} pointerEvents="none">
      {Array.from({ length: GRID_ROWS }).map((_, row) => (
        <View key={`r-${row}`} style={[styles.row, { top: row * GRID_SIZE }]}>
          {Array.from({ length: GRID_COLS }).map((__, col) => (
            <View key={`c-${col}`} style={styles.cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  cell: {
    borderColor: theme.colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    height: GRID_SIZE,
    width: `${100 / GRID_COLS}%`,
  },
});
