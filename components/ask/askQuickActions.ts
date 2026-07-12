import { FeedbackIcon, HistoryIcon, LessonsIcon } from '@/components/icons/AppIcons';

export const ASK_QUICK_ACTIONS = [
  {
    id: 'lessons' as const,
    label: 'Ask questions about lessons',
    hint: 'Practice tips from your roadmaps',
    Icon: LessonsIcon,
    seedMessage: 'Help me with my current lessons and what I should practice next.',
  },
  {
    id: 'feedback' as const,
    label: 'Share feedback',
    hint: "Tell us what's working or missing",
    Icon: FeedbackIcon,
    seedMessage: 'I want to share feedback about HobbyFlow.',
  },
  {
    id: 'history' as const,
    label: 'Continue a past conversation',
    hint: 'Pick up where you left off',
    Icon: HistoryIcon,
    seedMessage: null,
  },
];