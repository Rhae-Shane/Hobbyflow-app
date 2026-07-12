import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ActivePactCard } from '@/components/pact/ActivePactCard';
import { PactCreateForm } from '@/components/pact/PactCreateForm';
import { PactHistoryList } from '@/components/pact/PactHistoryList';
import {
  SealPactOverlay,
  type SealOverlayOrigin,
} from '@/components/pact/SealPactOverlay';
import { StreakCalendar } from '@/components/streak/StreakCalendar';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { dashboardColors } from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useGamificationStore } from '@/store/useGamificationStore';
import { usePactStore } from '@/store/usePactStore';
import { usePlanStore } from '@/store/usePlanStore';

export function PactScreen() {
  const { user } = useAuth();
  const hobbies = usePlanStore((s) => s.hobbies);
  const pactsFulfilled = useGamificationStore((s) => s.pactsFulfilled);
  const hydrate = usePactStore((s) => s.hydrate);
  const activePacts = usePactStore((s) => s.activePacts);
  const history = usePactStore((s) => s.history);
  const isMutating = usePactStore((s) => s.isMutating);
  const lastMessage = usePactStore((s) => s.lastMessage);
  const sealPact = usePactStore((s) => s.sealPact);
  const fulfillPact = usePactStore((s) => s.fulfillPact);
  const abandonPact = usePactStore((s) => s.abandonPact);

  const [sealOrigin, setSealOrigin] = useState<SealOverlayOrigin | null>(null);
  const [sealOverlayVisible, setSealOverlayVisible] = useState(false);
  const [sealSucceeded, setSealSucceeded] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const pactRanges = useMemo(
    () =>
      activePacts.map((pact) => ({
        startDate: pact.start_date,
        endDate: pact.end_date,
      })),
    [activePacts],
  );

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      void hydrate(user.id);
    }, [hydrate, user?.id]),
  );

  const onSealHoldStart = useCallback((origin: SealOverlayOrigin) => {
    setSealSucceeded(false);
    setSealOrigin(origin);
    setSealOverlayVisible(true);
  }, []);

  const onSealHoldCancel = useCallback(() => {
    setSealOverlayVisible(false);
    setSealOrigin(null);
    setSealSucceeded(false);
  }, []);

  const onSealOverlayFinished = useCallback(() => {
    setSealOverlayVisible(false);
    setSealOrigin(null);
    setSealSucceeded(false);
  }, []);

  const onSubmitSeal = useCallback(
    async (input: { hobbyId: string; promiseText: string; endDate: string }) => {
      const result = await sealPact(input);
      if (result.ok) setSealSucceeded(true);
      return result;
    },
    [sealPact],
  );

  const onComplete = (pactId: string) => {
    Alert.alert(
      'Complete this pact?',
      'Only tap this when you’ve actually hit the goal — before the deadline.',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Complete pact',
          onPress: () => {
            void fulfillPact(pactId).then((result) => {
              if (!result.ok) {
                Alert.alert('Couldn’t complete', result.message);
              }
            });
          },
        },
      ],
    );
  };

  const onAbandon = (pactId: string) => {
    Alert.alert(
      'Abandon this pact?',
      'Missing the goal lowers your rating (−15).',
      [
        { text: 'Keep going', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: () => {
            void abandonPact(pactId);
          },
        },
      ],
    );
  };

  return (
    <ScreenShell>
      <ScrollView
        scrollEnabled={scrollEnabled}
        contentContainerStyle={{
          paddingBottom: 32,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.keptCount}>Pacts kept: {pactsFulfilled}</Text>
        <Text style={styles.lead}>
          Seal as many goals as you want — each with its own deadline. Complete anytime before the
          end date.
        </Text>

        {lastMessage ? <Text style={styles.message}>{lastMessage}</Text> : null}

        {activePacts.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              Active {activePacts.length === 1 ? 'pact' : 'pacts'}
            </Text>
            {activePacts.map((pact) => (
              <ActivePactCard
                key={pact.id}
                pact={pact}
                isMutating={isMutating}
                onComplete={() => onComplete(pact.id)}
                onAbandon={() => onAbandon(pact.id)}
              />
            ))}
            <Text style={styles.sectionTitle}>Deadline calendar</Text>
            <Text style={styles.sectionSub}>Highlighted days are your pact windows</Text>
            <StreakCalendar activityDates={[]} saverUsedDates={[]} pactRanges={pactRanges} />
          </>
        ) : null}

        <Text style={styles.sectionTitle}>
          {activePacts.length > 0 ? 'Seal another pact' : 'Seal a pact'}
        </Text>
        <PactCreateForm
          hobbies={hobbies}
          isMutating={isMutating}
          sealHolding={sealOverlayVisible}
          onSealHoldStart={onSealHoldStart}
          onSealHoldCancel={onSealHoldCancel}
          onScrollLockChange={(locked) => setScrollEnabled(!locked)}
          onSubmit={onSubmitSeal}
        />

        <Text style={styles.sectionTitle}>History</Text>
        <Text style={styles.sectionSub}>Completed and broken pacts</Text>
        <PactHistoryList items={history} />
      </ScrollView>

      {sealOrigin ? (
        <SealPactOverlay
          visible={sealOverlayVisible}
          origin={sealOrigin}
          sealed={sealSucceeded}
          onFinished={onSealOverlayFinished}
        />
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  keptCount: {
    color: dashboardColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  lead: {
    color: dashboardColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
  },
  message: {
    color: dashboardColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    color: dashboardColors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  sectionSub: {
    color: dashboardColors.textMuted,
    fontSize: 13,
    marginTop: -8,
  },
});
