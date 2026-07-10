import { fireEvent, render } from '@testing-library/react-native';
import { GenerationHomeScreen } from '@/components/tabs/generate/GenerationHomeScreen';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('GenerationHomeScreen', () => {
  it('renders Inspo-style landing copy and suggestions', () => {
    const onStart = jest.fn();
    const { getByText } = render(<GenerationHomeScreen onStart={onStart} />);

    expect(getByText('What do you want to learn?')).toBeTruthy();
    expect(getByText('A Philosophy of Software Design')).toBeTruthy();
  });

  it('starts chat from composer text', () => {
    const onStart = jest.fn();
    const { getByTestId } = render(<GenerationHomeScreen onStart={onStart} />);

    fireEvent.changeText(getByTestId('generation-home-input'), 'I want to learn piano');
    fireEvent.press(getByTestId('generation-home-send'));
    expect(onStart).toHaveBeenCalledWith('I want to learn piano');
  });

  it('starts chat from a suggestion card', () => {
    const onStart = jest.fn();
    const { getByText } = render(<GenerationHomeScreen onStart={onStart} />);

    fireEvent.press(getByText('A Philosophy of Software Design'));
    expect(onStart).toHaveBeenCalledWith(
      expect.stringContaining('software design'),
    );
  });
});
