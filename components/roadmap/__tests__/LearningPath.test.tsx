import { fireEvent, render } from '@testing-library/react-native';
import { LearningPathNodeView } from '@/components/roadmap/LearningPathNodeView';
import { LearningPathSectionBar } from '@/components/roadmap/LearningPathSectionBar';
import { RoadmapPathCard } from '@/components/roadmap/RoadmapPathCard';
import type { LearningPathNode } from '@/lib/roadmap/learningPathBuilder';

const baseNode: LearningPathNode = {
  kind: 'path_node',
  nodeKind: 'lesson',
  id: 'lesson-path-1',
  nodeId: 'node-1',
  sectionId: 'sec-1',
  label: 'Keeping Time',
  visualState: 'current',
  pathOrder: 0,
  staggerIndex: 0,
  sessionConfig: {
    name: 'Keeping Time',
    hook: 'Can you find the pulse?',
  },
};

describe('LearningPathNodeView', () => {
  it('renders current lesson and handles press', () => {
    const onPress = jest.fn();
    const { getByText, getByTestId } = render(
      <LearningPathNodeView item={baseNode} onPress={onPress} />,
    );

    expect(getByText('Keeping Time')).toBeTruthy();
    fireEvent.press(getByTestId('path-node-lesson-path-1'));
    expect(onPress).toHaveBeenCalledWith(baseNode);
  });

  it('shows locked section review subtitle', () => {
    const locked: LearningPathNode = {
      ...baseNode,
      id: 'review-1',
      nodeKind: 'section_review',
      label: 'Section Review',
      subtitle: '0/2 sessions',
      visualState: 'locked',
      nodeId: null,
    };
    const { getByText } = render(
      <LearningPathNodeView item={locked} onPress={jest.fn()} />,
    );
    expect(getByText('Section Review')).toBeTruthy();
    expect(getByText('0/2 sessions')).toBeTruthy();
  });
});

describe('LearningPathSectionBar', () => {
  it('shows progress and toggles dropdown', () => {
    const onToggle = jest.fn();
    const onJournal = jest.fn();
    const { getByText, getByTestId } = render(
      <LearningPathSectionBar
        item={{
          kind: 'section_header',
          sectionId: 'sec-1',
          sectionIndex: 0,
          name: 'Rhythm Basics',
          completedLessons: 0,
          totalLessons: 3,
        }}
        expanded={false}
        onToggle={onToggle}
        onJournalPress={onJournal}
      />,
    );

    expect(getByText('1. Rhythm Basics')).toBeTruthy();
    expect(getByText('0/3 lessons')).toBeTruthy();
    fireEvent.press(getByTestId('section-bar-sec-1'));
    expect(onToggle).toHaveBeenCalledWith('sec-1');
    fireEvent.press(getByTestId('section-journal-sec-1'));
    expect(onJournal).toHaveBeenCalledWith('sec-1');
  });
});

describe('RoadmapPathCard', () => {
  it('toggles Map and Exercise modes', () => {
    const onModeChange = jest.fn();
    const { getByTestId, getByText } = render(
      <RoadmapPathCard
        title="Drumming Foundations for Beginners"
        completedLessons={1}
        totalLessons={4}
        mode="map"
        onModeChange={onModeChange}
        onOpenSwitcher={jest.fn()}
        onOpenMenu={jest.fn()}
      />,
    );

    expect(getByText('Module: Drumming Foundations for Beginners')).toBeTruthy();
    fireEvent.press(getByTestId('mode-exercise'));
    expect(onModeChange).toHaveBeenCalledWith('exercise');
  });
});
