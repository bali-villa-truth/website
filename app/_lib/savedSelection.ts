export const SAVED_STORAGE_KEY = 'bvt-favorites';

export function normalizeSavedIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((id): id is number =>
    typeof id === 'number' && Number.isSafeInteger(id) && id > 0
  )));
}

export function parseSavedSelection(raw: string | null): number[] {
  try {
    return normalizeSavedIds(JSON.parse(raw || 'null'));
  } catch {
    return [];
  }
}
