import { buildPlanRequestWithContext } from '@/lib/planRequestWithContext';
import type { UserPreferences } from '@/types/preferences.types';

describe('buildPlanRequestWithContext', () => {
  const preferences: UserPreferences = {
    topGoals: ['Pick up a brand-new hobby'],
    userRole: 'Student',
    ageRange: '18–24',
    accessibilityNeeds: ['None — no adjustments needed'],
    learningStrengths: [],
    practiceEnvironments: ['At home only'],
    resourceBudget: 'Free resources only',
    learningStyles: ['Video'],
    contentLanguage: 'en',
  };

  it('attaches learnerContext from saved preferences', () => {
    const request = buildPlanRequestWithContext(
      {
        hobby: 'Guitar',
        level: 'beginner',
        goal: 'play songs',
        timeBudget: '30 min/day',
      },
      preferences,
    );

    expect(request.learnerContext).toContain('Learner context:');
    expect(request.learnerContext).toContain('Student');
    expect(request.learnerContext).toContain('Practice environment:');
    expect(request.learnerContext).toContain('Resource budget: Free resources only');
  });

  it('supports custom userRole in learnerContext', () => {
    const request = buildPlanRequestWithContext(
      {
        hobby: 'Guitar',
        level: 'beginner',
        goal: '',
        timeBudget: '15 min/day',
      },
      { ...preferences, userRole: 'Independent artist' },
    );

    expect(request.learnerContext).toContain('- Independent artist');
  });

  it('omits learnerContext when preferences are incomplete', () => {
    const request = buildPlanRequestWithContext(
      {
        hobby: 'Guitar',
        level: 'beginner',
        goal: '',
        timeBudget: '15 min/day',
      },
      { ...preferences, ageRange: '', practiceEnvironments: [] },
    );

    expect(request.learnerContext).toBeUndefined();
  });

  it('omits learnerContext when preferences are missing', () => {
    const request = buildPlanRequestWithContext(
      {
        hobby: 'Guitar',
        level: 'beginner',
        goal: '',
        timeBudget: '15 min/day',
      },
      null,
    );

    expect(request.learnerContext).toBeUndefined();
  });
});
