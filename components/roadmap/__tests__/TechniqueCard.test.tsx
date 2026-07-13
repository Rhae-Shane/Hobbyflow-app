import { render } from '@testing-library/react-native';
import { TechniqueCard } from '@/components/roadmap/TechniqueCard';
import type { Technique } from '@/types/plan.types';

function makeTechnique(status: Technique['status']): Technique {
  return {
    id: 't1',
    name: 'Opening principles',
    why: 'Get a playable position.',
    order: 1,
    modality: 'video',
    estimatedMinutes: 20,
    searchQuery: 'chess opening principles',
    status,
  };
}

describe('TechniqueCard', () => {
  it.each([
    ['todo', 'To do'],
    ['in_progress', 'In progress'],
    ['mastered', 'Mastered'],
    ['skipped', 'Skipped'],
  ] as const)('renders %s status', (status, label) => {
    const { getByText } = render(
      <TechniqueCard technique={makeTechnique(status)} onPress={jest.fn()} />,
    );

    expect(getByText('Opening principles')).toBeTruthy();
    expect(getByText(label)).toBeTruthy();
  });

  it('applies strikethrough styling for skipped techniques', () => {
    const { getByText } = render(
      <TechniqueCard technique={makeTechnique('skipped')} onPress={jest.fn()} />,
    );

    const title = getByText('Opening principles');
    const flattened = Array.isArray(title.props.style)
      ? Object.assign({}, ...title.props.style)
      : title.props.style;

    expect(flattened.textDecorationLine).toBe('line-through');
    expect(flattened.color).toBe('#8A8F98');
  });
});
