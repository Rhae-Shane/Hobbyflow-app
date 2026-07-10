import { useCallback, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivePactCard } from '@/components/pact/ActivePactCard';
import { PactCreateForm } from '@/components/pact/PactCreateForm';
import { PactHistoryList } from '@/components/pact/PactHistoryList';
import { StreakCalendar } from '@/components/streak/StreakCalendar';
import { onboardingColors } from '@/constants/onboardingTokens';
import { spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useGamificationStore } from '@/store/useGamificationStore';
import { usePactStore } from '@/store/usePactStore';
import { usePlanStore } from '@/store/usePlanStore';

export function PactScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const hobbies = usePlanStore((s) => s.hobbies);
  const pactsFulfilled = useGamificationStore((s) => s.pactsFulfilled);
  const hydrate = usePactStore((s) => s.hydrate);
  const activePact = usePactStore((s) => s.activePact);
  const history = usePactStore((s) => s.history);
  const isMutating = usePactStore((s) => s.isMutating);
  const lastMessage = usePactStore((s) => s.lastMessage);
  const sealPact = usePactStore((s) => s.sealPact);
  const fulfillActivePact = usePactStore((s) => s.fulfillActivePact);
  const abandonActivePact = usePactStore((s) => s.abandonActivePact);

  const pactRange = useMemo(
    () =>
      activePact
        ? { startDate: activePact.start_date, endDate: activePact.end_date }
        : null,
    [activePact],
  );

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      void hydrate(user.id);
    }, [hydrate, user?.id]),
  );

  const onComplete = () => {
    Alert.alert(
      'Complete this pact?',
      'Only tap this when you’ve actually hit the goal — before the deadline.',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Complete pact',
          onPress: () => {
            void fulfillActivePact().then((result) => {
              if (!result.ok) {
                Alert.alert('Couldn’t complete', result.message);
              }
            });
          },
        },
      ],
    );
  };

  const onAbandon = () => {
    Alert.alert(
      'Abandon this pact?',
      'Missing the goal lowers your rating (−15).',
      [
        { text: 'Keep going', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: () => {
            void abandonActivePact();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Text style={styles.backGlyph}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>The Pact</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 32,
          paddingHorizontal: spacing.md,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.keptCount}>Pacts kept: {pactsFulfilled}</Text>
        <Text style={styles.lead}>
          One goal. One deadline. Complete it anytime before the end date — not a daily habit.
        </Text>

        {lastMessage ? <Text style={styles.message}>{lastMessage}</Text> : null}

        {activePact ? (
          <>
            <ActivePactCard
              pact={activePact}
              isMutating={isMutating}
              onComplete={onComplete}
              onAbandon={onAbandon}
            />
            <Text style={styles.sectionTitle}>Deadline calendar</Text>
            <Text style={styles.sectionSub}>Highlighted days are your pact window</Text>
            <StreakCalendar activityDates={[]} saverUsedDates={[]} pactRange={pactRange} />
          </>
        ) : (
          <PactCreateForm hobbies={hobbies} isMutating={isMutating} onSubmit={sealPact} />
        )}

        <Text style={styles.sectionTitle}>History</Text>
        <Text style={styles.sectionSub}>Completed and broken pacts</Text>
        <PactHistoryList items={history} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: onboardingColors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backGlyph: {
    color: onboardingColors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  headerTitle: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 40,
  },
  keptCount: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  lead: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
  },
  message: {
    color: onboardingColors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  sectionSub: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    marginTop: -8,
  },
});
