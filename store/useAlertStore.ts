import { create } from 'zustand';

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export type AlertButton = {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
};

export type AlertRequest = {
  title: string;
  message?: string;
  buttons: AlertButton[];
};

type AlertState = {
  current: AlertRequest | null;
  queue: AlertRequest[];
  show: (request: AlertRequest) => void;
  dismiss: () => void;
};

function normalizeButtons(buttons?: AlertButton[]): AlertButton[] {
  if (!buttons || buttons.length === 0) {
    return [{ text: 'OK', style: 'default' }];
  }
  return buttons;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  current: null,
  queue: [],
  show: (request) => {
    const next = {
      title: request.title,
      message: request.message,
      buttons: normalizeButtons(request.buttons),
    };
    const { current } = get();
    if (current) {
      set((state) => ({ queue: [...state.queue, next] }));
      return;
    }
    set({ current: next });
  },
  dismiss: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ current: next, queue: rest });
      return;
    }
    set({ current: null });
  },
}));

/** Drop-in replacement for React Native `Alert.alert` with themed UI. */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  useAlertStore.getState().show({
    title,
    message,
    buttons: normalizeButtons(buttons),
  });
}
