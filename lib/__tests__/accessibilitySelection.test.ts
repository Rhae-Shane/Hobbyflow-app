import { normalizeAccessibilitySelection } from '@/constants/preferences';

describe('normalizeAccessibilitySelection', () => {
  it('selects only None when None is toggled on', () => {
    expect(
      normalizeAccessibilitySelection(['Vision impairment / low vision'], 'None — no adjustments needed'),
    ).toEqual(['None — no adjustments needed']);
  });

  it('clears None when another need is selected', () => {
    expect(
      normalizeAccessibilitySelection(
        ['None — no adjustments needed'],
        'ADHD / attention differences',
      ),
    ).toEqual(['ADHD / attention differences']);
  });

  it('deselects an active exclusive option when toggled again', () => {
    expect(
      normalizeAccessibilitySelection(['Prefer not to say'], 'Prefer not to say'),
    ).toEqual([]);
  });
});
