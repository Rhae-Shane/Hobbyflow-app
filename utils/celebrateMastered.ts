import { Platform, Vibration } from 'react-native';

export async function celebrateMastered(): Promise<void> {
  if (Platform.OS !== 'web') {
    Vibration.vibrate(100);
  }

  if (Platform.OS === 'web') {
    const confetti = (await import('canvas-confetti')).default;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
    });
  }
}
