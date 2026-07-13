import { apiRequest } from '@/services/client';

export type LeaderboardUserIdsQuery =
  | { kind: 'category'; categoryId: number }
  | { kind: 'tag'; hobbyId: number | null; tagName: string };

export async function fetchLeaderboardUserIds(
  filter: LeaderboardUserIdsQuery,
): Promise<string[]> {
  const params = new URLSearchParams();
  params.set('kind', filter.kind);
  if (filter.kind === 'category') {
    params.set('categoryId', String(filter.categoryId));
  } else {
    if (filter.hobbyId != null) params.set('hobbyId', String(filter.hobbyId));
    if (filter.tagName) params.set('tagName', filter.tagName);
  }

  const res = await apiRequest<{ userIds: string[] }>(
    `/api/v1/leaderboard/user-ids?${params.toString()}`,
  );
  return res.userIds ?? [];
}
