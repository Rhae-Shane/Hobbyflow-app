export type RoadmapCreationFlowState =
  | 'collecting-input'
  | 'clarifying'
  | 'confirming-goal'
  | 'reviewing-outline';

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

export type LessonPlanLesson = {
  name: string;
  hook: string;
  meaning: string;
};

export type LessonPlanSection = {
  name: string;
  lessons: LessonPlanLesson[];
};

export type LessonPlanResponse = {
  type: 'lesson_plan';
  courseTitle: string;
  sections: LessonPlanSection[];
  stage: 'outline';
  lessonPlanId: string;
  message?: string;
  flowState: 'reviewing-outline';
};

export type RoadmapCreationChatResponse =
  | ClarificationResponse
  | GoalSuggestionResponse
  | LessonPlanResponse;

export type RoadmapCreationChatRequest = {
  message: string;
  messages: ChatTurnMessage[];
  flowState: RoadmapCreationFlowState;
  userRoles: string[];
  isFirstRoadmap: boolean;
  intent?: 'chat' | 'generate_outline';
  learnerContextSummary?: string;
  /** Current outline when requesting changes — prevents hallucination */
  currentLessonPlan?: LessonPlanState;
  roadmapName?: string;
  roadmapGoal?: string;
  roadmapBackground?: string;
  conversationId?: string;
};

export type DisplayMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'clarification' | 'goal_suggestion' | 'lesson_plan';
  metadata?: {
    quickReplies?: QuickReply[];
    multiSelect?: boolean;
    suggestedHobby?: string;
    suggestedName?: string;
    suggestedGoal?: string;
    suggestedBackground?: string;
    suggestedLevel?: 'beginner' | 'intermediate' | 'advanced';
    courseTitle?: string;
    sections?: LessonPlanSection[];
    stage?: 'outline';
    lessonPlanId?: string;
  };
};

export type GoalCardState = {
  suggestedHobby: string;
  suggestedName: string;
  suggestedGoal: string;
  suggestedBackground: string;
  suggestedLevel: 'beginner' | 'intermediate' | 'advanced';
};

export type LessonPlanState = {
  courseTitle: string;
  sections: LessonPlanSection[];
  stage: 'outline';
  lessonPlanId: string;
};
