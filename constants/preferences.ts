export const TOP_GOALS = [
  'Make better use of my time',
  'Build new skills',
  'Boost my career',
  'Understand complex topics',
  'Explore new topics',
  'Just for fun',
  'Remember important learning',
] as const;

export const TOPIC_TAGS = [
  'AI',
  'Psychology',
  'Philosophy',
  'Economics',
  'History',
  'Investing',
  'Design',
  'Learning',
  'Longevity',
  'Decision Making',
  'Business',
  'Science',
  'Self-Improvement',
  'Strategy',
  'Software Engineering',
] as const;

export const USER_ROLES = [
  'Product Manager',
  'Business/Management',
  'Designer/Creative',
  'Student',
  'Developer/Engineer',
  'Research/Academic',
  'Finance/Investment',
] as const;

export const LEARNING_STYLES = [
  'Bite-sized lessons',
  'Practice exercises',
  'Regular review',
  'Hands-on projects',
  'Visual explanations',
  'Clear learning path',
  'Real-world examples',
  'Personalized difficulty',
] as const;

export const DAILY_GOAL_OPTIONS = [
  { value: '5', label: '5 min', subtitle: 'A toilet break' },
  { value: '10', label: '10 min', subtitle: 'A bus ride' },
  { value: '15', label: '15 min', subtitle: 'A lunch break' },
  { value: '20', label: '> 20 min', subtitle: "I'm SERIOUS" },
] as const;

export const LEARNING_STYLE_SUPPORT = {
  currentlySupports: [
    'Visual explanations',
    'Regular review',
    'Personalized difficulty',
    'Real-world examples',
  ],
  workingOn: ['Hands-on projects'],
  alsoSupports: ['Bite-sized lessons', 'Practice exercises', 'Clear learning path'],
} as const;

export const DEFAULT_CONTENT_LANGUAGE = 'en';
