import { fireEvent, render } from '@testing-library/react-native';
import { AskAnythingSheet } from '@/components/ask/AskAnythingSheet';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('AskAnythingSheet', () => {
  it('renders placeholder actions when visible', () => {
    const onClose = jest.fn();
    const { getByText } = render(<AskAnythingSheet visible onClose={onClose} />);

    expect(getByText('How can I help you today?')).toBeTruthy();
    expect(getByText('Ask questions about lessons')).toBeTruthy();
    fireEvent.press(getByText('Share feedback'));
    expect(onClose).toHaveBeenCalled();
  });
});
