import { fireEvent, render, screen } from '@testing-library/react-native';
import { StreakCalendar } from '@/components/streak/StreakCalendar';

describe('StreakCalendar pact range', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-11T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows pact legend when an active range is provided', () => {
    render(
      <StreakCalendar
        activityDates={[]}
        saverUsedDates={[]}
        pactRange={{ startDate: '2026-07-11', endDate: '2026-07-17' }}
      />,
    );
    expect(screen.getByLabelText('Pact days on calendar')).toBeTruthy();
    expect(screen.getByText(/The Pact/)).toBeTruthy();
  });

  it('hides pact legend when there is no active pact', () => {
    render(<StreakCalendar activityDates={[]} saverUsedDates={[]} />);
    expect(screen.queryByLabelText('Pact days on calendar')).toBeNull();
  });

  it('allows selecting a custom deadline day', () => {
    const onSelectDate = jest.fn();
    render(
      <StreakCalendar
        activityDates={[]}
        saverUsedDates={[]}
        pactRange={{ startDate: '2026-07-11', endDate: '2026-07-20' }}
        selectableMin="2026-07-17"
        onSelectDate={onSelectDate}
        selectHint="Tap a day to set a custom deadline"
      />,
    );
    expect(screen.getByText('Tap a day to set a custom deadline')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Select 2026-07-20'));
    expect(onSelectDate).toHaveBeenCalledWith('2026-07-20');
  });
});
