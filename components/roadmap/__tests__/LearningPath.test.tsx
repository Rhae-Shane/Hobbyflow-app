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

  it('shows Now practice CTA', () => {
    const practice: LearningPathNode = {
      ...baseNode,
      id: 'practice-1',
      nodeKind: 'practice',
      label: 'Now practice',
      subtitle: 'Open practice',
      visualState: 'available',
      nodeId: null,
    };
    const onPress = jest.fn();
    const { getByText, getByTestId } = render(
      <LearningPathNodeView item={practice} onPress={onPress} />,
    );
    expect(getByText('Now practice')).toBeTruthy();
    expect(getByText('Open practice')).toBeTruthy();
    fireEvent.press(getByTestId('path-node-practice-1'));
    expect(onPress).toHaveBeenCalledWith(practice);
  });

  it('renders skipped lesson with strikethrough label', () => {
    const skipped: LearningPathNode = {
      ...baseNode,
      id: 'lesson-skipped',
      visualState: 'skipped',
      lessonStatus: 'skipped',
    };
    const { getByText, getByTestId } = render(
      <LearningPathNodeView item={skipped} onPress={jest.fn()} />,
    );
    expect(getByText('Keeping Time')).toBeTruthy();
    expect(getByText('Skipped')).toBeTruthy();
    expect(getByTestId('path-node-lesson-skipped')).toBeTruthy();
  });
});

describe('LearningPathSectionBar', () => {
  it('shows progress and toggles dropdown', () => {
    const onToggle = jest.fn();
    const onMenu = jest.fn();
    const { getByText, getByTestId } = render(
      <LearningPathSectionBar
        item={{
          kind: 'section_header',
          sectionId: 'sec-1',
          sectionIndex: 0,
          name: 'Rhythm Basics',
          completedLessons: 0,
          totalLessons: 3,
          activeLessons: 3,
        }}
        expanded={false}
        onToggle={onToggle}
        onMenuPress={onMenu}
      />,
    );

    expect(getByText('1. Rhythm Basics')).toBeTruthy();
    expect(getByText('0/3 lessons')).toBeTruthy();
    fireEvent.press(getByTestId('section-bar-sec-1'));
    expect(onToggle).toHaveBeenCalledWith('sec-1');
    fireEvent.press(getByTestId('section-menu-sec-1'));
    expect(onMenu).toHaveBeenCalled();
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
