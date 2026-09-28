export const COMPARISON_STORAGE_KEY = 'bvt-comparison';
export const MAX_COMPARISON_VILLAS = 5;

export function normalizeComparisonIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const ids: number[] = [];
  for (const id of value) {
    if (typeof id === 'number' && Number.isSafeInteger(id) && id > 0 && !ids.includes(id)) {
      ids.push(id);
      if (ids.length === MAX_COMPARISON_VILLAS) break;
    }
  }
  return ids;
}

export function parseComparisonSelection(raw: string | null): number[] {
  try {
    return normalizeComparisonIds(JSON.parse(raw || 'null'));
  } catch {
    return [];
  }
}
