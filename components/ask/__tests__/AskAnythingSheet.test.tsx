import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AskAnythingSheet } from '@/components/ask/AskAnythingSheet';

jest.mock('lottie-react-native', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => <View testID="lottie" {...props} />,
  };
});

jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  const Mock = (props: Record<string, unknown>) => <View {...props} />;
  return {
    __esModule: true,
    default: Mock,
    Svg: Mock,
    Path: Mock,
    Circle: Mock,
    Rect: Mock,
    Ellipse: Mock,
  };
});

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: () => ({ data: [], isLoading: false }),
  };
});

jest.mock('@/services/roadmaps', () => ({
  fetchUserRoadmaps: jest.fn(async () => []),
  fetchRoadmapDetail: jest.fn(async () => ({ lessons: [], nodes: [], roadmap: null })),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('@/store/useGamificationStore', () => ({
  useGamificationStore: (sel: (s: { activityDates: string[] }) => unknown) =>
    sel({ activityDates: [] }),
}));

jest.mock('@/store/useRoadmapUiStore', () => ({
  useRoadmapUiStore: (sel: (s: { selectedRoadmapId: string | null }) => unknown) =>
    sel({ selectedRoadmapId: null }),
}));

jest.mock('@/hooks/useAskAnythingChat', () => ({
  useAskAnythingChat: () => ({
    view: 'new',
    conversationId: null,
    messages: [],
    title: null,
    conversations: [],
    sending: false,
    error: null,
    newChat: jest.fn(),
    openHistory: jest.fn(),
    selectChat: jest.fn(),
    deleteChat: jest.fn(),
    send: jest.fn(),
  }),
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderSheet(ui: React.ReactElement) {
  return render(<SafeAreaProvider initialMetrics={initialMetrics}>{ui}</SafeAreaProvider>);
}

describe('AskAnythingSheet', () => {
  it('renders companion greeting and composer', () => {
    const onClose = jest.fn();
    renderSheet(<AskAnythingSheet visible onClose={onClose} />);
    expect(screen.getByText('Hobby Companion')).toBeTruthy();
    expect(screen.getByText('Hi! How can I support your learning today?')).toBeTruthy();
    expect(screen.getByPlaceholderText('Ask me anything..')).toBeTruthy();
    expect(screen.getByText('Review my lessons')).toBeTruthy();
  });

  it('closes from the top bar', () => {
    const onClose = jest.fn();
    renderSheet(<AskAnythingSheet visible onClose={onClose} />);
    fireEvent.press(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
