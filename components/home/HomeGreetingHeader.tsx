import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  dashboardColors,
  dashboardRadii,
} from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';

type Props = {
  username: string | null;
  onProfilePress?: () => void;
  onBellPress?: () => void;
};

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function displayFirstName(username: string | null): string {
  if (!username) return 'there';
  const cleaned = username.replace(/^@/, '');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Home greeting under the global AppChromeHeader (avatar lives in chrome). */
export function HomeGreetingHeader({ username, onProfilePress, onBellPress }: Props) {
  const hour = new Date().getHours();
  const greeting = greetingForHour(hour);
  const name = displayFirstName(username);

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.textCol}
        onPress={onProfilePress}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        testID="home-profile-avatar"
      >
        <Text style={styles.greeting} numberOfLines={1}>
          {greeting}, {name}
        </Text>
        <Text style={styles.sub}>Your hobby dashboard</Text>
      </Pressable>
      {onBellPress ? (
        <Pressable
          style={styles.bellWrap}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={onBellPress}
        >
          <Text style={styles.bellGlyph}>🔔</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  textCol: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    color: dashboardColors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sub: {
    color: dashboardColors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  bellWrap: {
    alignItems: 'center',
    backgroundColor: dashboardColors.surface,
    borderRadius: dashboardRadii.avatar,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  bellGlyph: {
    fontSize: 18,
  },
});
