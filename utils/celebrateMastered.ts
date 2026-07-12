import { Platform } from 'react-native';
import { hapticSuccess } from '@/utils/haptics';

export async function celebrateMastered(): Promise<void> {
  hapticSuccess();

  if (Platform.OS === 'web') {
    const confetti = (await import('canvas-confetti')).default;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
    });
  }
}
