import { buildPreferencesAiContext } from '@/constants/preferences';

describe('buildPreferencesAiContext', () => {
  it('includes role, age, accessibility, environment, budget, and content format hints', () => {
    const context = buildPreferencesAiContext({
      userRole: 'Working professional',
      ageRange: '25–34',
      topGoals: ['Pick up a brand-new hobby'],
      accessibilityNeeds: ['ADHD / attention differences'],
      learningStrengths: ['Learn well by doing'],
      practiceEnvironments: ['At home only', 'Small space / apartment'],
      resourceBudget: 'Free resources only',
      learningStyles: ['Video', 'Daily tasks'],
    });

    expect(context).toContain('Learner context:');
    expect(context).toContain('Working professional');
    expect(context).toContain('Age range: 25–34');
    expect(context).toContain('Practice environment:');
    expect(context).toContain('Resource budget: Free resources only');
  });

  it('adds an override when blindness conflicts with video preference', () => {
    const context = buildPreferencesAiContext({
      userRole: 'Student',
      ageRange: '18–24',
      topGoals: ['Relax and de-stress'],
      accessibilityNeeds: ['Blindness'],
      learningStrengths: ['Learn well by listening'],
      practiceEnvironments: ['At home only'],
      resourceBudget: 'Free resources only',
      learningStyles: ['Video', 'Audio'],
    });

    expect(context).toContain('Accessibility override: Blindness takes priority over video preference');
  });
});
