import { RoadmapCreationChatScreen } from '@/components/roadmap-creation/RoadmapCreationChatScreen';

/**
 * Generation tab — roadmap creation chat lives here (no separate landing page).
 */
export function GenerateTabScreen() {
  return <RoadmapCreationChatScreen variant="add" embeddedInTabs />;
}
