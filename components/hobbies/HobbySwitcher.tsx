import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BottomSheetOrModal } from '@/components/BottomSheetOrModal';
import { useSwitchHobby } from '@/hooks/useSwitchHobby';
import { colors, fonts, radii, spacing } from '@/constants/tokens';
import { usePlanStore } from '@/store/usePlanStore';
import type { HobbyRow } from '@/types/user.types';
import { hapticLight, hapticSelection } from '@/utils/haptics';

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
      hapticSelection();
      await switchHobby(hobbyId);
      setOpen(false);
    } catch {
      // Error logged in hook
    }
  };

  const handleAddHobby = () => {
    hapticLight();
    setOpen(false);
    router.push('/(app)/(tabs)/generate' as never);
  };

  if (hobbies.length === 0 && !plan) {
    return null;
  }

  return (
    <>
      <Pressable
        style={[styles.trigger, compact && styles.triggerCompact]}
        onPress={() => {
          hapticLight();
          setOpen(true);
        }}
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

      <BottomSheetOrModal
        visible={open}
        onClose={() => setOpen(false)}
        animationType="fade"
        maxHeight="70%"
      >
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
      </BottomSheetOrModal>
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
    fontFamily: fonts.display,
    fontSize: 24,
  },
  triggerLabelCompact: {
    fontSize: 24,
  },
  triggerHint: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  chevron: {
    color: colors.textMuted,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  sheetTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 20,
  },
  sheetSubtitle: {
    color: colors.textMuted,
    fontFamily: fonts.body,
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
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
  },
  hobbyNameSelected: {
    color: colors.primary,
  },
  hobbyMeta: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  activeBadge: {
    color: colors.primary,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
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
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
});
