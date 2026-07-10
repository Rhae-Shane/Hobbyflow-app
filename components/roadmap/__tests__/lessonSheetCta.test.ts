import type { LearningPathNode } from '@/lib/roadmap/learningPathBuilder';

function ctaLabel(status: LearningPathNode['lessonStatus'], hasPages: boolean): string {
  const canStart =
    hasPages && (status === 'ready' || status === 'in_progress' || status === 'completed');
  if (canStart) {
    return status === 'completed' ? 'REVIEW LESSON' : 'START LESSON';
  }
  if (status === 'failed') return 'RETRY GENERATE';
  return 'GENERATE AND JUMP AHEAD';
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
});
