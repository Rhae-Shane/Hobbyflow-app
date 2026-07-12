export type PostMediaKind = 'image' | 'video' | 'audio';

export type SocialPlatform =
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'x'
  | 'linkedin'
  | 'github'
  | 'website'
  | 'other';

export type SocialLink = {
  id: string;
  userId: string;
  platform: SocialPlatform;
  url: string;
  handle: string | null;
  sortOrder: number;
};

export type PostMedia = {
  id: string;
  kind: PostMediaKind;
  storagePath: string;
  publicUrl: string;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  sortOrder: number;
};

export type PostHobbyTag = {
  hobbyId: number | null;
  name: string;
  source: 'catalog' | 'custom';
};

export type FeedPost = {
  id: string;
  authorId: string;
  caption: string;
  createdAt: string;
  username: string;
  displayName: string;
  media: PostMedia[];
  tags: PostHobbyTag[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

export type PostComment = {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  username: string;
  displayName: string;
};

export const MAX_TAGS_PER_POST = 5;
export const MAX_COMMENT_LENGTH = 1000;

export type LocalMediaDraft = {
  localUri: string;
  kind: PostMediaKind;
  mimeType: string;
  fileName: string;
  fileSize: number;
  width?: number;
  height?: number;
  durationMs?: number;
};

export const MAX_MEDIA_PER_POST = 10;
export const MAX_CAPTION_LENGTH = 2200;
export const MAX_BIO_LENGTH = 160;
export const MAX_SOCIAL_LINKS = 8;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_DURATION_MS = 3 * 60 * 1000;
export const MAX_AUDIO_DURATION_MS = 10 * 60 * 1000;

export const SOCIAL_PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'x', label: 'X' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'github', label: 'GitHub' },
  { id: 'website', label: 'Website' },
  { id: 'other', label: 'Other' },
];
