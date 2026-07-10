export type RoadmapIntro = {
  intro: string;
  achievements: string;
  coverPalette?: string;
};

export type MaterializeRoadmapRequest = {
  hobby: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  goalCard: {
    suggestedHobby: string;
    suggestedName: string;
    suggestedGoal: string;
    suggestedBackground: string;
    suggestedLevel: 'beginner' | 'intermediate' | 'advanced';
  };
  lessonPlan: {
    courseTitle: string;
    sections: Array<{
      name: string;
      lessons: Array<{ name: string; hook: string; meaning: string }>;
    }>;
    stage: 'outline';
    lessonPlanId: string;
  };
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  userRoles: string[];
  conversationId?: string;
  learnerContextSummary?: string;
  isFirstRoadmap: boolean;
};

export type MaterializeRoadmapResponse = {
  roadmapId: string;
  hobbyId: string;
  title: string;
  intro: RoadmapIntro;
  coverImageUrl: string | null;
  sections: Array<{ id: string; name: string; lessonCount: number }>;
  lessonCount: number;
};

export type RoadmapNodeRow = {
  id: string;
  roadmap_id: string;
  user_id: string;
  type: 'Section' | 'Lesson';
  name: string;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

export type RoadmapLessonRow = {
  id: string;
  roadmap_id: string;
  node_id: string;
  user_id: string;
  path_order: number;
  status: 'pending_content' | 'ready' | 'in_progress' | 'completed';
  session_config: {
    name?: string;
    hook?: string;
    meaning?: string;
  };
};

export type RoadmapRow = {
  id: string;
  user_id: string;
  hobby_id: string;
  title: string;
  lesson_plan_id: string | null;
  outline: Record<string, unknown>;
  personalize_metadata: Record<string, unknown>;
  intro: RoadmapIntro;
  cover_image_path: string | null;
  status: 'preview' | 'active' | 'archived';
  mindmap?: RoadmapMindMap | null;
};

export type MindMapNode = {
  id: string;
  label: string;
  lessonNodeIds: string[];
  colorIndex?: number;
  children: MindMapNode[];
};

export type RoadmapMindMap = {
  title: string;
  root: MindMapNode;
  metadata: {
    version: string;
    createdAt: string;
    language: string;
    roadmapId: string;
    roadmapTitle: string;
    lessonCount: number;
    sectionCount: number;
    practiceCount: number;
    knowledgeCardCount: number;
    sourceFingerprint: string;
    personalizationEnabled: boolean;
  };
};

export type GenerateMindMapResponse = {
  mindMap: RoadmapMindMap;
};

export type RoadmapDetailResponse = {
  roadmap: RoadmapRow;
  nodes: RoadmapNodeRow[];
  lessons: RoadmapLessonRow[];
};
