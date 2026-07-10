export type RoadmapCreationFlowState = 'collecting-input' | 'clarifying' | 'confirming-goal';

export type ChatTurnMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type QuickReply = { text: string };

export type ClarificationResponse = {
  type: 'clarification';
  message: string;
  quickReplies: QuickReply[];
  multiSelect: boolean;
  flowState: 'collecting-input' | 'clarifying';
};

export type GoalSuggestionResponse = {
  type: 'goal_suggestion';
  message: string;
  suggestedHobby: string;
  suggestedName: string;
  suggestedGoal: string;
  suggestedBackground: string;
  suggestedLevel?: 'beginner' | 'intermediate' | 'advanced';
  flowState: 'confirming-goal';
};

export type RoadmapCreationChatResponse = ClarificationResponse | GoalSuggestionResponse;

export type RoadmapCreationChatRequest = {
  message: string;
  messages: ChatTurnMessage[];
  flowState: RoadmapCreationFlowState;
  userRoles: string[];
  isFirstRoadmap: boolean;
  roadmapName?: string;
  roadmapGoal?: string;
  roadmapBackground?: string;
  conversationId?: string;
};

export type DisplayMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'clarification' | 'goal_suggestion';
  metadata?: {
    quickReplies?: QuickReply[];
    multiSelect?: boolean;
    suggestedHobby?: string;
    suggestedName?: string;
    suggestedGoal?: string;
    suggestedBackground?: string;
    suggestedLevel?: 'beginner' | 'intermediate' | 'advanced';
  };
};

export type GoalCardState = {
  suggestedHobby: string;
  suggestedName: string;
  suggestedGoal: string;
  suggestedBackground: string;
  suggestedLevel: 'beginner' | 'intermediate' | 'advanced';
};
