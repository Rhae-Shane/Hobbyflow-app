import LottieView from 'lottie-react-native';
import { StyleSheet, View } from 'react-native';

type Props = {
  size?: number;
};

export function AskCoachLottie({ size = 56 }: Props) {
  return (
    <View style={[styles.wrap, { height: size, width: size }]}>
      <LottieView
        autoPlay
        loop
        source={require('@/assets/lottie/coach-sparkle.json')}
        style={{ height: size, width: size }}
      />
    </View>
  );
}

export function AskEmptyHistoryLottie({ size = 120 }: Props) {
  return (
    <View style={[styles.wrap, { height: size, width: size }]}>
      <LottieView
        autoPlay
        loop
        source={require('@/assets/lottie/empty-chat.json')}
        style={{ height: size, width: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
