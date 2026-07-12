export const ASK_SUGGESTION_CHIPS = [
  {
    id: 'lessons',
    label: 'Review my lessons',
    seedMessage: 'Help me with my current lessons and what I should practice next.',
  },
  {
    id: 'streak',
    label: 'Check my streak',
    seedMessage: 'How is my streak looking and what should I do today to keep it?',
  },
  {
    id: 'roadmap',
    label: 'What’s next on my roadmap?',
    seedMessage: 'What should I focus on next in my active roadmap?',
  },
  {
    id: 'feedback',
    label: 'Share feedback',
    seedMessage: 'I want to share feedback about HobbyFlow.',
  },
  {
    id: 'history',
    label: 'Past chats',
    seedMessage: null,
  },
] as const;

/** @deprecated Prefer ASK_SUGGESTION_CHIPS — kept for any legacy imports. */
export const ASK_QUICK_ACTIONS = ASK_SUGGESTION_CHIPS;
