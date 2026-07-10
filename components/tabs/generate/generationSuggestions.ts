export type GenerationSuggestion = {
  id: string;
  category: string;
  title: string;
  author: string;
  accent: string;
  imageUrl: string;
  prompt: string;
};

/** Curated hobby starter cards for the Generation tab landing. */
export const GENERATION_SUGGESTIONS: GenerationSuggestion[] = [
  {
    id: 'guitar',
    category: 'Music',
    title: 'Acoustic Guitar Basics',
    author: 'Chords to songs',
    accent: '#C4A484',
    imageUrl:
      'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&h=400&fit=crop&q=80',
    prompt: 'I want to learn acoustic guitar from scratch and play songs I love.',
  },
  {
    id: 'cooking',
    category: 'Food',
    title: 'Home Cooking Essentials',
    author: 'Weeknight meals',
    accent: '#E8A87C',
    imageUrl:
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop&q=80',
    prompt: 'I want to learn home cooking fundamentals and make delicious weeknight meals.',
  },
  {
    id: 'drawing',
    category: 'Art',
    title: 'Sketching & Drawing',
    author: 'Pencil to page',
    accent: '#8FAADC',
    imageUrl:
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop&q=80',
    prompt: 'I want to learn sketching and drawing, starting with fundamentals and simple subjects.',
  },
  {
    id: 'yoga',
    category: 'Wellness',
    title: 'Yoga for Beginners',
    author: 'Breath & balance',
    accent: '#A8C5A0',
    imageUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop&q=80',
    prompt: 'I want to learn yoga for beginners, focusing on breath, flexibility, and calm.',
  },
  {
    id: 'photography',
    category: 'Creative',
    title: 'Phone Photography',
    author: 'Everyday shots',
    accent: '#7BA87B',
    imageUrl:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop&q=80',
    prompt: 'I want to learn photography with my phone and take better everyday photos.',
  },
  {
    id: 'pottery',
    category: 'Crafts',
    title: 'Pottery & Ceramics',
    author: 'Hands in clay',
    accent: '#C9A88A',
    imageUrl:
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=400&fit=crop&q=80',
    prompt: 'I want to learn pottery and ceramics, from hand-building basics to simple glazed pieces.',
  },
];
