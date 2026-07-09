import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSwitchHobby } from '@/hooks/useSwitchHobby';
import { colors, radii, spacing } from '@/constants/tokens';
import { usePlanStore } from '@/store/usePlanStore';
import type { HobbyRow } from '@/types/user.types';

const LEVEL_LABELS: Record<HobbyRow['level'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

type Props = {
  compact?: boolean;
};

export function HobbySwitcher({ compact = false }: Props) {
  const router = useRouter();
  const hobbies = usePlanStore((s) => s.hobbies);
  const activeHobbyId = usePlanStore((s) => s.activeHobbyId);
  const plan = usePlanStore((s) => s.plan);
  const { switchHobby, isSwitching } = useSwitchHobby();
  const [open, setOpen] = useState(false);

  const activeHobby = hobbies.find((h) => h.id === activeHobbyId) ?? hobbies[0];
  const displayName = activeHobby?.name ?? plan?.hobby ?? 'Select hobby';

  const handleSelect = async (hobbyId: string) => {
    try {
      await switchHobby(hobbyId);
      setOpen(false);
    } catch {
      // Error logged in hook
    }
  };

  const handleAddHobby = () => {
    setOpen(false);
    router.push('/(app)/onboarding?mode=add');
  };

  if (hobbies.length === 0 && !plan) {
    return null;
  }

  return (
    <>
      <Pressable
        style={[styles.trigger, compact && styles.triggerCompact]}
        onPress={() => setOpen(true)}
        disabled={isSwitching}
      >
        <View style={styles.triggerTextBlock}>
          <Text style={[styles.triggerLabel, compact && styles.triggerLabelCompact]}>
            {displayName}
          </Text>
          {!compact && hobbies.length > 0 ? (
            <Text style={styles.triggerHint}>
              {hobbies.length} {hobbies.length === 1 ? 'hobby' : 'hobbies'} · Tap to switch
            </Text>
          ) : null}
        </View>
        {isSwitching ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Text style={styles.chevron}>▾</Text>
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Your hobbies</Text>
            <Text style={styles.sheetSubtitle}>Select one to view its roadmap and progress.</Text>

            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {hobbies.map((hobby) => {
                const selected = hobby.id === activeHobbyId;
                return (
                  <Pressable
                    key={hobby.id}
                    style={[styles.hobbyRow, selected && styles.hobbyRowSelected]}
                    onPress={() => handleSelect(hobby.id)}
                  >
                    <View style={styles.hobbyInfo}>
                      <Text style={[styles.hobbyName, selected && styles.hobbyNameSelected]}>
                        {hobby.name}
                      </Text>
                      <Text style={styles.hobbyMeta}>
                        {LEVEL_LABELS[hobby.level]}
                        {hobby.goal ? ` · ${hobby.goal}` : ''}
                      </Text>
                    </View>
                    {selected ? <Text style={styles.activeBadge}>Active</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable style={styles.addButton} onPress={handleAddHobby}>
              <Text style={styles.addButtonText}>+ Add another hobby</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  triggerCompact: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  triggerTextBlock: {
    flex: 1,
    gap: 2,
  },
  triggerLabel: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  triggerLabelCompact: {
    fontSize: 24,
  },
  triggerHint: {
    color: colors.textMuted,
    fontSize: 13,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    maxHeight: '70%',
    padding: spacing.lg,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  sheetSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  list: {
    marginTop: spacing.md,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  hobbyRow: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  hobbyRowSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  hobbyInfo: {
    flex: 1,
    gap: 2,
  },
  hobbyName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  hobbyNameSelected: {
    color: colors.primary,
  },
  hobbyMeta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  activeBadge: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  addButton: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: radii.card,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});
