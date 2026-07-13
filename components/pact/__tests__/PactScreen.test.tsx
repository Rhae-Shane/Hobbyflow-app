import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PactScreen } from '@/components/pact/PactScreen';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useFocusEffect: (cb: () => void) => {
    cb();
  },
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('@/utils/haptics', () => ({
  hapticLight: jest.fn(),
  hapticMedium: jest.fn(),
  hapticSelection: jest.fn(),
  hapticSuccess: jest.fn(),
  hapticError: jest.fn(),
  hapticWarning: jest.fn(),
}));

const mockHydrate = jest.fn();
const mockSealPact = jest.fn();

jest.mock('@/store/usePlanStore', () => ({
  usePlanStore: (selector: (s: { hobbies: unknown[] }) => unknown) =>
    selector({
      hobbies: [
        {
          id: 'h1',
          user_id: 'user-1',
          name: 'Guitar',
          level: 'beginner',
          goal: '',
          is_active: true,
          created_at: '',
          updated_at: '',
        },
      ],
    }),
}));

jest.mock('@/store/useGamificationStore', () => ({
  useGamificationStore: (selector: (s: { pactsFulfilled: number }) => unknown) =>
    selector({ pactsFulfilled: 2 }),
}));

jest.mock('@/store/usePactStore', () => ({
  usePactStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      hydrate: mockHydrate,
      activePacts: [],
      history: [],
      isMutating: false,
      lastMessage: null,
      sealPact: mockSealPact,
      fulfillPact: jest.fn(),
      abandonPact: jest.fn(),
    }),
}));

describe('PactScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockHydrate.mockClear();
    mockSealPact.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders create form when no active pact', () => {
    render(<PactScreen />);
    expect(screen.getByText('Seal a pact')).toBeTruthy();
    expect(screen.getByText('Pacts kept: 2')).toBeTruthy();
    expect(screen.getByText('Press & hold to seal your pact')).toBeTruthy();
    expect(mockHydrate).toHaveBeenCalledWith('user-1');
  });

  it('seals a pact after holding the seal button', async () => {
    render(<PactScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText('Make my jump 6 feet'),
      'Make my jump 6 feet',
    );

    fireEvent(screen.getByTestId('seal-pact-hold'), 'pressIn', {
      nativeEvent: { pageX: 200, pageY: 600 },
    });

    await act(async () => {
      jest.advanceTimersByTime(950);
    });

    await waitFor(() => {
      expect(mockSealPact).toHaveBeenCalled();
    });
  });
});
