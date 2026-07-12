import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { askCompanionColors } from '@/constants/askCompanionTokens';
import { spacing } from '@/constants/tokens';

type Props = {
  title?: string;
  onBack: () => void;
  onMenu: () => void;
};

function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 6L9 12L15 18"
        stroke={askCompanionColors.text}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MenuIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M5 7H19" stroke={askCompanionColors.text} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M5 12H19" stroke={askCompanionColors.text} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M5 17H19" stroke={askCompanionColors.text} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function AskSheetTopBar({ title = 'Hobby Companion', onBack, onMenu }: Props) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} style={styles.iconBtn} accessibilityLabel="Close">
        <BackIcon />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Pressable onPress={onMenu} style={styles.iconBtn} accessibilityLabel="Chat history">
        <MenuIcon />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    zIndex: 1,
  },
  iconBtn: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  title: {
    color: askCompanionColors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
});
