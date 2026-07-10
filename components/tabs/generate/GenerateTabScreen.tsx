import { useState } from 'react';
import { GenerationHomeScreen } from '@/components/tabs/generate/GenerationHomeScreen';
import { RoadmapCreationChatScreen } from '@/components/roadmap-creation/RoadmapCreationChatScreen';

/**
 * Generation tab: Inspo-style landing → creation chat on the same tab (no redirect).
 */
export function GenerateTabScreen() {
  const [seedPrompt, setSeedPrompt] = useState<string | null>(null);

  if (!seedPrompt) {
    return <GenerationHomeScreen onStart={setSeedPrompt} />;
  }

  return (
    <RoadmapCreationChatScreen
      key={seedPrompt}
      variant="add"
      embeddedInTabs
      initialPrompt={seedPrompt}
      onBack={() => setSeedPrompt(null)}
    />
  );
}
