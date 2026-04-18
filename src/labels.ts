// labels.ts — key/value label management for endpoints

export type Labels = Record<string, string>;

export function parseLabels(input: unknown): Labels {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const result: Labels = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (typeof k === 'string' && typeof v === 'string') {
      result[k.trim()] = v.trim();
    }
  }
  return result;
}

export function normalizeLabels(labels: Labels): Labels {
  return Object.fromEntries(
    Object.entries(labels).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()])
  );
}

export function hasLabel(labels: Labels, key: string, value?: string): boolean {
  const k = key.toLowerCase();
  if (!(k in labels)) return false;
  if (value === undefined) return true;
  return labels[k] === value.toLowerCase();
}

export function matchesLabels(labels: Labels, selector: Labels): boolean {
  return Object.entries(selector).every(([k, v]) => hasLabel(labels, k, v));
}

export function mergeLabels(...sources: Labels[]): Labels {
  return Object.assign({}, ...sources);
}

export function formatLabels(labels: Labels): string {
  return Object.entries(labels)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
}

export function labelKeys(labels: Labels): string[] {
  return Object.keys(labels);
}

export function labelValues(labels: Labels): string[] {
  return Object.values(labels);
}

/**
 * Returns a new Labels object with the specified keys removed.
 */
export function omitLabels(labels: Labels, ...keys: string[]): Labels {
  const omit = new Set(keys.map(k => k.toLowerCase()));
  return Object.fromEntries(
    Object.entries(labels).filter(([k]) => !omit.has(k.toLowerCase()))
  );
}
