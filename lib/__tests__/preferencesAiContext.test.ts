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

    expect(context).toContain('Role: Working professional');
    expect(context).toContain('Age: 25–34');
    expect(context).toContain('Environment:');
    expect(context).toContain('Budget: Free resources only');
    expect(context).toContain('Formats:');
    expect(context).toContain('- ADHD / attention differences:');
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

    expect(context).toContain('- Blindness:');
    expect(context).toContain('Override: Blindness > video');
  });

  it('keeps the compact profile under a short length budget', () => {
    const context = buildPreferencesAiContext({
      userRole: 'Parent / caregiver',
      ageRange: '35–44',
      topGoals: ['Level up skills I already have'],
      accessibilityNeeds: ['Blindness', 'Hearing impairment / deafness'],
      learningStrengths: ['Good at breaking down steps', 'Learn well by doing'],
      practiceEnvironments: ['Need quiet practice', 'Can practice outdoors'],
      resourceBudget: 'Moderate budget',
      learningStyles: ['Video', 'Text', 'Daily tasks', 'Audio'],
    });

    expect(context.length).toBeLessThan(900);
    expect(context).toContain('Override: Blindness > video');
    expect(context).toContain('Override: Hearing impairment > audio');
  });
});
