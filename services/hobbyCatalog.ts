import { supabase } from '@/lib/supabase';
import { createLogger } from '@/lib/logger';

const log = createLogger('hobbyCatalog');

export type HobbyCategoryIllustration = {
  id: number;
  name: string;
  sortOrder: number;
  illustrationKey: string;
  illustrationUrl: string | null;
};

export type HobbyNameCategoryMap = Record<
  string,
  { categoryId: number; illustrationKey: string; illustrationUrl: string | null }
>;

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export async function fetchHobbyCategoryIllustrations(): Promise<HobbyCategoryIllustration[]> {
  const { data, error } = await supabase
    .from('hobby_category')
    .select('id, name, sort_order, illustration_key, illustration_url')
    .order('sort_order', { ascending: true });

  if (error) {
    log.warn('Failed to fetch hobby category illustrations', { error: error.message });
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as number,
    name: row.name as string,
    sortOrder: row.sort_order as number,
    illustrationKey: row.illustration_key as string,
    illustrationUrl: (row.illustration_url as string | null) ?? null,
  }));
}

/** Map catalog hobby names → category illustration for roadmap/home matching. */
export async function fetchHobbyNameIllustrationMap(): Promise<HobbyNameCategoryMap> {
  const { data, error } = await supabase
    .from('all_hobbies')
    .select('name, category_id, hobby_category(illustration_key, illustration_url)');

  if (error) {
    log.warn('Failed to fetch hobby name illustration map', { error: error.message });
    return {};
  }

  const map: HobbyNameCategoryMap = {};
  for (const row of data ?? []) {
    const rawCat = row.hobby_category as
      | { illustration_key?: string; illustration_url?: string | null }
      | { illustration_key?: string; illustration_url?: string | null }[]
      | null;
    const cat = Array.isArray(rawCat) ? rawCat[0] : rawCat;
    const key = cat?.illustration_key;
    if (!key || typeof row.name !== 'string') continue;
    map[normalizeName(row.name)] = {
      categoryId: row.category_id as number,
      illustrationKey: key,
      illustrationUrl: cat?.illustration_url ?? null,
    };
  }
  return map;
}

export function resolveIllustrationForTitle(
  title: string,
  nameMap: HobbyNameCategoryMap,
): { illustrationKey: string | null; illustrationUrl: string | null } {
  const direct = nameMap[normalizeName(title)];
  if (direct) {
    return {
      illustrationKey: direct.illustrationKey,
      illustrationUrl: direct.illustrationUrl,
    };
  }

  // Roadmap titles often include the hobby name as a prefix/substring.
  let best: { illustrationKey: string; illustrationUrl: string | null; len: number } | null = null;
  const hay = normalizeName(title);
  for (const [hobbyName, info] of Object.entries(nameMap)) {
    if (hobbyName.length < 3) continue;
    if (hay.includes(hobbyName) && (!best || hobbyName.length > best.len)) {
      best = {
        illustrationKey: info.illustrationKey,
        illustrationUrl: info.illustrationUrl,
        len: hobbyName.length,
      };
    }
  }
  return {
    illustrationKey: best?.illustrationKey ?? null,
    illustrationUrl: best?.illustrationUrl ?? null,
  };
}
