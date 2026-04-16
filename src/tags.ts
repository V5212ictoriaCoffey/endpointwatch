export interface TagSet {
  tags: string[];
}

export function parseTags(input: string | string[] | undefined): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((t) => t.trim()).filter(Boolean);
  return input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((t) => t.toLowerCase()))];
}

export function hasTag(tags: string[], tag: string): boolean {
  return tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase());
}

export function hasAllTags(tags: string[], required: string[]): boolean {
  return required.every((r) => hasTag(tags, r));
}

export function hasAnyTag(tags: string[], candidates: string[]): boolean {
  return candidates.some((c) => hasTag(tags, c));
}

export function mergeTags(...tagSets: string[][]): string[] {
  return normalizeTags(tagSets.flat());
}

export function tagSummary(tags: string[]): string {
  if (tags.length === 0) return '(no tags)';
  return tags.join(', ');
}
