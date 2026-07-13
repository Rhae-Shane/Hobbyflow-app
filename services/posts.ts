import { decode as decodeBase64 } from 'base64-arraybuffer';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { createLogger } from '@/lib/logger';
import { AppError, ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import {
  MAX_AUDIO_BYTES,
  MAX_AUDIO_DURATION_MS,
  MAX_CAPTION_LENGTH,
  MAX_COMMENT_LENGTH,
  MAX_IMAGE_BYTES,
  MAX_MEDIA_PER_POST,
  MAX_TAGS_PER_POST,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_MS,
  type FeedPost,
  type LocalMediaDraft,
  type PostComment,
  type PostHobbyTag,
  type PostMedia,
  type PostMediaKind,
} from '@/types/post.types';

const log = createLogger('posts');
const BUCKET = 'post-media';

export function mapPostTags(raw: unknown): PostHobbyTag[] {
  if (!Array.isArray(raw)) return [];
  const out: PostHobbyTag[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!name) continue;
    const source: PostHobbyTag['source'] =
      row.source === 'catalog' || row.source === 'custom' ? row.source : 'custom';
    const hobbyIdRaw = row.hobbyId ?? row.hobby_id;
    const hobbyId =
      typeof hobbyIdRaw === 'number' && Number.isInteger(hobbyIdRaw) ? hobbyIdRaw : null;
    out.push({
      hobbyId: source === 'custom' ? null : hobbyId,
      name,
      source,
    });
  }
  return out;
}

function mapMedia(raw: unknown): PostMedia[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const row = item as Record<string, unknown>;
    return {
      id: (row.id as string) ?? `media-${index}`,
      kind: row.kind as PostMediaKind,
      storagePath: (row.storage_path as string) ?? '',
      publicUrl: (row.public_url as string) ?? '',
      mimeType: (row.mime_type as string | null) ?? null,
      width: (row.width as number | null) ?? null,
      height: (row.height as number | null) ?? null,
      durationMs: (row.duration_ms as number | null) ?? null,
      sortOrder: (row.sort_order as number) ?? index,
    };
  });
}

function mapFeedRow(row: Record<string, unknown>): FeedPost {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    caption: (row.caption as string) ?? '',
    createdAt: row.created_at as string,
    username: row.username as string,
    displayName: (row.display_name as string) || (row.username as string),
    media: mapMedia(row.media),
    tags: mapPostTags(row.tags),
    likeCount: typeof row.like_count === 'number' ? row.like_count : 0,
    commentCount: typeof row.comment_count === 'number' ? row.comment_count : 0,
    likedByMe: Boolean(row.liked_by_me),
  };
}

function mapCommentRow(row: Record<string, unknown>): PostComment {
  return {
    id: row.id as string,
    postId: row.post_id as string,
    authorId: row.author_id as string,
    body: (row.body as string) ?? '',
    createdAt: row.created_at as string,
    username: row.username as string,
    displayName: (row.display_name as string) || (row.username as string),
  };
}

export function validateMediaDraft(draft: LocalMediaDraft): string | null {
  if (draft.kind === 'image' && draft.fileSize > MAX_IMAGE_BYTES) {
    return 'Images must be 10 MB or smaller.';
  }
  if (draft.kind === 'video' && draft.fileSize > MAX_VIDEO_BYTES) {
    return 'Videos must be 100 MB or smaller.';
  }
  if (draft.kind === 'audio' && draft.fileSize > MAX_AUDIO_BYTES) {
    return 'Audio must be 25 MB or smaller.';
  }
  if (
    draft.kind === 'video' &&
    draft.durationMs != null &&
    draft.durationMs > MAX_VIDEO_DURATION_MS
  ) {
    return 'Videos must be 3 minutes or shorter.';
  }
  if (
    draft.kind === 'audio' &&
    draft.durationMs != null &&
    draft.durationMs > MAX_AUDIO_DURATION_MS
  ) {
    return 'Audio must be 10 minutes or shorter.';
  }
  return null;
}

function extFromMime(mime: string, kind: PostMediaKind): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('quicktime') || mime.includes('mov')) return 'mov';
  if (mime.includes('mp4') && kind === 'video') return 'mp4';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('aac') || mime.includes('m4a')) return 'm4a';
  if (kind === 'video') return 'mp4';
  if (kind === 'audio') return 'm4a';
  return 'jpg';
}

/**
 * React Native cannot reliably upload Blobs from local `file://` / `content://`
 * URIs via fetch+blob — Supabase Storage returns "Network request failed".
 * Read bytes via FileSystem and upload an ArrayBuffer instead.
 */
async function readLocalUriAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  let fileUri = uri;
  if (uri.startsWith('content://') || uri.startsWith('ph://') || uri.startsWith('assets-library://')) {
    const dest = `${FileSystem.cacheDirectory}post-upload-${Crypto.randomUUID()}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    fileUri = dest;
  }

  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return decodeBase64(base64);
}

async function uploadMediaFile(
  userId: string,
  postId: string,
  draft: LocalMediaDraft,
  sortOrder: number,
): Promise<PostMedia> {
  const mediaId = Crypto.randomUUID();
  const ext = extFromMime(draft.mimeType, draft.kind);
  const storagePath = `${userId}/${postId}/${mediaId}.${ext}`;

  let body: ArrayBuffer;
  try {
    body = await readLocalUriAsArrayBuffer(draft.localUri);
  } catch (err: unknown) {
    log.error('Failed to read local media file', {
      uri: draft.localUri,
      error: err instanceof Error ? err.message : 'unknown',
    });
    throw new AppError(ErrorCodes.SYNC_FAILED, 'Failed to read media file for upload.', {
      cause: err,
    });
  }

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, body, {
    contentType: draft.mimeType || 'application/octet-stream',
    upsert: false,
  });

  if (uploadError) {
    log.error('Media upload failed', { storagePath, error: uploadError.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, 'Failed to upload media.', { cause: uploadError });
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const publicUrl = publicData.publicUrl;

  const { data, error } = await supabase
    .from('post_media')
    .insert({
      id: mediaId,
      post_id: postId,
      kind: draft.kind,
      storage_path: storagePath,
      public_url: publicUrl,
      mime_type: draft.mimeType,
      width: draft.width ?? null,
      height: draft.height ?? null,
      duration_ms: draft.durationMs ?? null,
      sort_order: sortOrder,
    })
    .select(
      'id, kind, storage_path, public_url, mime_type, width, height, duration_ms, sort_order',
    )
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    kind: row.kind as PostMediaKind,
    storagePath: row.storage_path as string,
    publicUrl: row.public_url as string,
    mimeType: (row.mime_type as string | null) ?? null,
    width: (row.width as number | null) ?? null,
    height: (row.height as number | null) ?? null,
    durationMs: (row.duration_ms as number | null) ?? null,
    sortOrder: (row.sort_order as number) ?? sortOrder,
  };
}

export async function listFeed(opts?: {
  limit?: number;
  beforeCreatedAt?: string | null;
  beforeId?: string | null;
  authorId?: string | null;
  tagFilter?: string | null;
  hobbyIdFilter?: number | null;
  /** Home feed defaults to true; profile / search browse use false */
  viewerScoped?: boolean;
}): Promise<FeedPost[]> {
  const authorId = opts?.authorId ?? null;
  const viewerScoped = opts?.viewerScoped ?? authorId == null;

  const { data, error } = await supabase.rpc('list_feed', {
    p_limit: opts?.limit ?? 20,
    p_before_created_at: opts?.beforeCreatedAt ?? null,
    p_before_id: opts?.beforeId ?? null,
    p_author_id: authorId,
    p_tag_filter: opts?.tagFilter ?? null,
    p_hobby_id_filter: opts?.hobbyIdFilter ?? null,
    p_viewer_scoped: viewerScoped,
  });

  if (error) {
    log.error('list_feed failed', { error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return (data ?? []).map((row: Record<string, unknown>) => mapFeedRow(row));
}

export async function createPost(input: {
  authorId: string;
  caption: string;
  media: LocalMediaDraft[];
  tags: PostHobbyTag[];
  onProgress?: (done: number, total: number) => void;
}): Promise<FeedPost> {
  const caption = input.caption.trim();
  if (!caption && input.media.length === 0) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Add a caption or at least one photo, video, or audio.');
  }
  if (caption.length > MAX_CAPTION_LENGTH) {
    throw new AppError(
      ErrorCodes.VALIDATION_ERROR,
      `Caption must be ${MAX_CAPTION_LENGTH} characters or fewer.`,
    );
  }
  if (input.media.length > MAX_MEDIA_PER_POST) {
    throw new AppError(
      ErrorCodes.VALIDATION_ERROR,
      `You can attach up to ${MAX_MEDIA_PER_POST} media items.`,
    );
  }
  if (input.tags.length < 1 || input.tags.length > MAX_TAGS_PER_POST) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Add at least one hobby tag.');
  }

  for (const draft of input.media) {
    const err = validateMediaDraft(draft);
    if (err) throw new AppError(ErrorCodes.VALIDATION_ERROR, err);
  }

  const tagsPayload = input.tags.map((t) => ({
    hobbyId: t.source === 'catalog' ? t.hobbyId : null,
    name: t.name.trim(),
    source: t.source,
  }));

  const { data: postIdRaw, error: postError } = await supabase.rpc('create_post_with_tags', {
    p_caption: caption,
    p_tags: tagsPayload,
  });

  if (postError || !postIdRaw) {
    const message = postError?.message ?? '';
    if (
      message.includes('hobby tag') ||
      message.includes('username') ||
      message.includes('profile before posting') ||
      message.includes('hobbies on your profile')
    ) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, message);
    }
    log.error('create_post_with_tags failed', { error: message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: postError,
    });
  }

  const postId = String(postIdRaw);
  const uploadedPaths: string[] = [];
  const mediaRows: PostMedia[] = [];

  try {
    for (let i = 0; i < input.media.length; i += 1) {
      const uploaded = await uploadMediaFile(input.authorId, postId, input.media[i], i);
      mediaRows.push(uploaded);
      uploadedPaths.push(uploaded.storagePath);
      input.onProgress?.(i + 1, input.media.length);
    }
  } catch (err) {
    await supabase
      .from('posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', postId);
    if (uploadedPaths.length) {
      await supabase.storage.from(BUCKET).remove(uploadedPaths);
    }
    throw err;
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('username, full_name')
    .eq('id', input.authorId)
    .maybeSingle();

  const { data: createdAtRow } = await supabase
    .from('posts')
    .select('created_at')
    .eq('id', postId)
    .maybeSingle();

  const username = (userRow?.username as string) || 'user';
  return {
    id: postId,
    authorId: input.authorId,
    caption,
    createdAt: (createdAtRow?.created_at as string) ?? new Date().toISOString(),
    username,
    displayName: (userRow?.full_name as string)?.trim() || username,
    media: mediaRows,
    tags: input.tags,
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
  };
}

export async function softDeletePost(postId: string, authorId: string): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', postId)
    .eq('author_id', authorId)
    .is('deleted_at', null);

  if (error) {
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }
}

export async function getPostById(postId: string): Promise<FeedPost | null> {
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const { data: post, error } = await supabase
    .from('posts')
    .select(
      'id, author_id, caption, created_at, like_count, comment_count, users!inner(username, full_name)',
    )
    .eq('id', postId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    log.error('getPostById failed', { error: error.message, postId });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }
  if (!post) return null;

  const author = post.users as unknown as { username: string; full_name: string | null };
  if (!author?.username) return null;

  const [{ data: mediaRows }, { data: tagRows }, likeResult] = await Promise.all([
    supabase
      .from('post_media')
      .select(
        'id, kind, storage_path, public_url, mime_type, width, height, duration_ms, sort_order',
      )
      .eq('post_id', postId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('post_hobby_tags')
      .select('hobby_id, name, source')
      .eq('post_id', postId)
      .order('name', { ascending: true }),
    viewer?.id
      ? supabase
          .from('post_likes')
          .select('post_id')
          .eq('post_id', postId)
          .eq('user_id', viewer.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return mapFeedRow({
    id: post.id,
    author_id: post.author_id,
    caption: post.caption,
    created_at: post.created_at,
    username: author.username,
    display_name: author.full_name?.trim() || author.username,
    media: mediaRows ?? [],
    tags: (tagRows ?? []).map((t) => ({
      hobbyId: t.hobby_id,
      name: t.name,
      source: t.source,
    })),
    like_count: post.like_count ?? 0,
    comment_count: post.comment_count ?? 0,
    liked_by_me: Boolean(likeResult.data),
  });
}

export async function togglePostLike(
  postId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const { data, error } = await supabase.rpc('toggle_post_like', {
    p_post_id: postId,
  });

  if (error) {
    log.error('toggle_post_like failed', { error: error.message, postId });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  const row = (data ?? {}) as Record<string, unknown>;
  return {
    liked: Boolean(row.liked),
    likeCount: typeof row.like_count === 'number' ? row.like_count : 0,
  };
}

export async function listPostComments(opts: {
  postId: string;
  limit?: number;
  beforeCreatedAt?: string | null;
  beforeId?: string | null;
}): Promise<PostComment[]> {
  const { data, error } = await supabase.rpc('list_post_comments', {
    p_post_id: opts.postId,
    p_limit: opts.limit ?? 30,
    p_before_created_at: opts.beforeCreatedAt ?? null,
    p_before_id: opts.beforeId ?? null,
  });

  if (error) {
    log.error('list_post_comments failed', { error: error.message, postId: opts.postId });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return (data ?? []).map((row: Record<string, unknown>) => mapCommentRow(row));
}

export async function addPostComment(postId: string, body: string): Promise<PostComment> {
  const trimmed = body.trim();
  if (trimmed.length < 1 || trimmed.length > MAX_COMMENT_LENGTH) {
    throw new AppError(
      ErrorCodes.VALIDATION_ERROR,
      `Comment must be 1–${MAX_COMMENT_LENGTH} characters.`,
    );
  }

  const { data, error } = await supabase.rpc('add_post_comment', {
    p_post_id: postId,
    p_body: trimmed,
  });

  if (error) {
    const message = error.message ?? '';
    if (message.includes('1–1000') || message.includes('characters')) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, message);
    }
    log.error('add_post_comment failed', { error: message, postId });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const row = rows[0];
  if (!row) {
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED));
  }
  return mapCommentRow(row);
}

export async function softDeletePostComment(commentId: string): Promise<void> {
  const { error } = await supabase.rpc('soft_delete_post_comment', {
    p_comment_id: commentId,
  });

  if (error) {
    log.error('soft_delete_post_comment failed', { error: error.message, commentId });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }
}
