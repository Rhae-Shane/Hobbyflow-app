export type LessonMediaKind = 'image' | 'video' | 'audio';

export type LessonMediaAsset = {
  id: string;
  kind: LessonMediaKind;
  url: string;
  storagePath?: string;
  title?: string;
  alt?: string;
  /** Client never receives searchQuery — only resolved assets. */
  source: {
    provider: 'google_images' | 'youtube' | 'llm_svg' | 'upload' | 'curated';
    externalId?: string;
    sourceUrl?: string;
    fetchedAt: string;
  };
  durationSeconds?: number;
  thumbnailUrl?: string;
};

export type LessonBlock =
  | { type: 'markdown'; markdown: string }
  | { type: 'image'; mediaId: string; caption?: string }
  | { type: 'video'; mediaId: string; caption?: string }
  | { type: 'audio'; mediaId: string; caption?: string }
  | { type: 'interactive'; interactiveType: string; data: Record<string, unknown> };

export type LessonPage = {
  heading: string;
  blocks: LessonBlock[];
};

export type LessonNodeContent = {
  pages: LessonPage[];
  media: LessonMediaAsset[];
  keywords: Array<{ name: string; description: string }>;
  concepts: Array<{ name: string; description: string }>;
  sourceContent: string;
  generation?: {
    graphVersion: string;
    generatedAt: string;
    requestGroupId: string;
    durationMs: number;
    skippedModalities?: string[];
  };
};

export type RoadmapLessonStatus =
  | 'pending_content'
  | 'generating'
  | 'ready'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'skipped';

export type GenerateLessonResponse = {
  status: 'success' | 'generating' | 'failed';
  message?: string;
  lessonId: string;
  nodeId?: string;
  requestGroupId?: string;
  generationDurationMs?: number;
  error?: { code: string; message: string };
};
