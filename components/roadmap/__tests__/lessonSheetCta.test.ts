import type { LearningPathNode } from '@/lib/roadmap/learningPathBuilder';
import type { RoadmapLessonStatus } from '@/types/lessonContent.types';

function ctaLabel(status: LearningPathNode['lessonStatus'], hasPages: boolean): string {
  if (status === 'skipped') return 'SKIPPED';
  const canStart =
    hasPages && (status === 'ready' || status === 'in_progress' || status === 'completed');
  if (canStart) {
    return status === 'completed' ? 'REVIEW LESSON' : 'START LESSON';
  }
  if (status === 'failed') return 'RETRY GENERATE';
  return 'GENERATE AND JUMP AHEAD';
}

function showRegenerate(status: RoadmapLessonStatus | undefined): boolean {
  return (
    status === 'ready' ||
    status === 'in_progress' ||
    status === 'completed' ||
    status === 'failed'
  );
}

function showSkip(status: RoadmapLessonStatus | undefined): boolean {
  return status !== 'skipped';
}

describe('lesson sheet CTA', () => {
  it('shows generate for pending_content', () => {
    expect(ctaLabel('pending_content', false)).toBe('GENERATE AND JUMP AHEAD');
  });

  it('shows start for ready with pages', () => {
    expect(ctaLabel('ready', true)).toBe('START LESSON');
  });

  it('shows retry for failed', () => {
    expect(ctaLabel('failed', false)).toBe('RETRY GENERATE');
  });

  it('shows skipped state without generate', () => {
    expect(ctaLabel('skipped', false)).toBe('SKIPPED');
  });

  it('shows regenerate for ready/failed/completed but not pending or skipped', () => {
    expect(showRegenerate('ready')).toBe(true);
    expect(showRegenerate('failed')).toBe(true);
    expect(showRegenerate('completed')).toBe(true);
    expect(showRegenerate('pending_content')).toBe(false);
    expect(showRegenerate('skipped')).toBe(false);
  });

  it('shows skip unless already skipped', () => {
    expect(showSkip('pending_content')).toBe(true);
    expect(showSkip('ready')).toBe(true);
    expect(showSkip('skipped')).toBe(false);
  });
});
