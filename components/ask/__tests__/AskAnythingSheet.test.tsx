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
  };
});

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
  it('renders greeting and editable composer', () => {
    const onClose = jest.fn();
    renderSheet(<AskAnythingSheet visible onClose={onClose} />);
    expect(screen.getByText('How can I help you today?')).toBeTruthy();
    expect(screen.getByPlaceholderText('Ask anything about your learning...')).toBeTruthy();
  });

  it('closes from the top bar', () => {
    const onClose = jest.fn();
    renderSheet(<AskAnythingSheet visible onClose={onClose} />);
    fireEvent.press(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
