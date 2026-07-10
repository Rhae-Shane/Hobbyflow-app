import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSwitchHobby } from '@/hooks/useSwitchHobby';
import { colors, radii, spacing } from '@/constants/tokens';
import { getMasteredCount, usePlanStore } from '@/store/usePlanStore';
import type { HobbyRow } from '@/types/user.types';

const LEVEL_LABELS: Record<HobbyRow['level'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function HobbiesList() {
  const router = useRouter();
  const hobbies = usePlanStore((s) => s.hobbies);
  const activeHobbyId = usePlanStore((s) => s.activeHobbyId);
  const hobbySnapshots = usePlanStore((s) => s.hobbySnapshots);
  const plan = usePlanStore((s) => s.plan);
  const { switchHobby, isSwitching } = useSwitchHobby();

  if (hobbies.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No hobbies yet.</Text>
        <Pressable onPress={() => router.push('/(app)/roadmap-creation?mode=add')}>
          <Text style={styles.emptyLink}>Add your first hobby</Text>
        </Pressable>
      </View>
    );
  }

  const getProgressLabel = (hobbyId: string): string => {
    const snapshot = hobbySnapshots[hobbyId];
    const activePlan = hobbyId === activeHobbyId ? plan : snapshot?.plan;
    if (!activePlan) return 'No roadmap yet';
    const mastered = getMasteredCount(activePlan.techniques);
    const active = activePlan.techniques.filter((t) => t.status !== 'skipped').length;
    return `${mastered} / ${active} mastered`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your hobbies</Text>
        <Pressable onPress={() => router.push('/(app)/roadmap-creation?mode=add')}>
          <Text style={styles.addLink}>+ Add</Text>
        </Pressable>
      </View>

      <View style={styles.table}>
        <View style={[styles.row, styles.headerTableRow]}>
          <Text style={[styles.cellText, styles.headerCell, styles.nameCol]}>Hobby</Text>
          <Text style={[styles.cellText, styles.headerCell, styles.levelCol]}>Level</Text>
          <Text style={[styles.cellText, styles.headerCell, styles.progressCol]}>Progress</Text>
        </View>

        {hobbies.map((hobby) => {
          const selected = hobby.id === activeHobbyId;
          return (
            <Pressable
              key={hobby.id}
              style={[styles.row, selected && styles.rowSelected]}
              disabled={isSwitching}
              onPress={() => switchHobby(hobby.id)}
            >
              <View style={styles.nameCol}>
                <Text style={[styles.hobbyName, selected && styles.hobbyNameSelected]}>
                  {hobby.name}
                </Text>
                {selected ? <Text style={styles.activeTag}>Working on this</Text> : null}
              </View>
              <Text style={[styles.cellText, styles.levelCol, styles.muted]}>
                {LEVEL_LABELS[hobby.level]}
              </Text>
              <Text style={[styles.cellText, styles.progressCol, styles.muted]}>
                {getProgressLabel(hobby.id)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  addLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  table: {
    gap: spacing.xs,
  },
  row: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: colors.primary,
  },
  headerTableRow: {
    backgroundColor: colors.background,
    borderWidth: 0,
  },
  cellText: {
    fontSize: 14,
  },
  headerCell: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  nameCol: {
    flex: 2,
  },
  levelCol: {
    flex: 1,
  },
  progressCol: {
    flex: 1.2,
    textAlign: 'right',
  },
  hobbyName: {
    color: colors.text,
    fontWeight: '600',
  },
  hobbyNameSelected: {
    color: colors.primary,
  },
  activeTag: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  muted: {
    color: colors.textMuted,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  emptyLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
