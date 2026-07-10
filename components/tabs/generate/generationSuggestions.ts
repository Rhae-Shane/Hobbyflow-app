export type GenerationSuggestion = {
  id: string;
  category: string;
  title: string;
  author: string;
  accent: string;
  prompt: string;
};

/** Curated starter cards for the Generation tab landing (Inspo-style). */
export const GENERATION_SUGGESTIONS: GenerationSuggestion[] = [
  {
    id: 'soft-design',
    category: 'Software Engineering',
    title: 'A Philosophy of Software Design',
    author: 'John Ousterhout',
    accent: '#7CCBFA',
    prompt: 'I want to learn software design principles and how to write simpler, better code.',
  },
  {
    id: 'biz-lean',
    category: 'Business',
    title: 'Lean Startup Fundamentals',
    author: 'Eric Ries',
    accent: '#F5C26B',
    prompt: 'I want to learn lean startup methods to validate business ideas quickly.',
  },
  {
    id: 'music-drums',
    category: 'Music',
    title: 'Drumming Foundations',
    author: 'HobbyFlow',
    accent: '#9B7BB8',
    prompt: 'I want to learn drumming from scratch and play along to songs I love.',
  },
  {
    id: 'photo',
    category: 'Creative',
    title: 'Everyday Photography',
    author: 'HobbyFlow',
    accent: '#7BA87B',
    prompt: 'I want to learn photography with my phone and take better everyday photos.',
  },
];
