import { fireEvent, render, screen } from '@testing-library/react-native';
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
      activePact: null,
      history: [],
      isMutating: false,
      lastMessage: null,
      sealPact: mockSealPact,
      fulfillActivePact: jest.fn(),
      abandonActivePact: jest.fn(),
    }),
}));

describe('PactScreen', () => {
  beforeEach(() => {
    mockHydrate.mockClear();
    mockSealPact.mockResolvedValue({ ok: true });
  });

  it('renders create form when no active pact', () => {
    render(<PactScreen />);
    expect(screen.getByText('The Pact')).toBeTruthy();
    expect(screen.getByText('Pacts kept: 2')).toBeTruthy();
    expect(screen.getByText('Seal the Pact')).toBeTruthy();
    expect(mockHydrate).toHaveBeenCalledWith('user-1');
  });

  it('seals a pact from the form', () => {
    render(<PactScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText('Make my jump 6 feet'),
      'Make my jump 6 feet',
    );
    fireEvent.press(screen.getByText('Seal the Pact'));
    expect(mockSealPact).toHaveBeenCalled();
  });
});
