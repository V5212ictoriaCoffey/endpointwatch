/**
 * drift.ts — Detects configuration or response schema drift between poll cycles.
 */

export interface DriftEntry {
  url: string;
  field: string;
  previous: unknown;
  current: unknown;
  detectedAt: number;
}

export interface DriftStore {
  snapshots: Map<string, Record<string, unknown>>;
  drifts: DriftEntry[];
}

export function createDriftStore(): DriftStore {
  return { snapshots: new Map(), drifts: [] };
}

export function captureSnapshot(
  store: DriftStore,
  url: string,
  fields: Record<string, unknown>
): void {
  store.snapshots.set(url, { ...fields });
}

export function detectDrift(
  store: DriftStore,
  url: string,
  fields: Record<string, unknown>,
  now = Date.now()
): DriftEntry[] {
  const previous = store.snapshots.get(url);
  if (!previous) {
    captureSnapshot(store, url, fields);
    return [];
  }

  const detected: DriftEntry[] = [];

  for (const key of new Set([...Object.keys(previous), ...Object.keys(fields)])) {
    const prev = previous[key];
    const curr = fields[key];
    if (JSON.stringify(prev) !== JSON.stringify(curr)) {
      const entry: DriftEntry = { url, field: key, previous: prev, current: curr, detectedAt: now };
      detected.push(entry);
      store.drifts.push(entry);
    }
  }

  captureSnapshot(store, url, fields);
  return detected;
}

export function getDrifts(store: DriftStore, url?: string): DriftEntry[] {
  if (!url) return [...store.drifts];
  return store.drifts.filter((d) => d.url === url);
}

export function clearDrifts(store: DriftStore, url?: string): void {
  if (!url) {
    store.drifts = [];
  } else {
    store.drifts = store.drifts.filter((d) => d.url !== url);
  }
}

export function formatDrift(entry: DriftEntry): string {
  return `[DRIFT] ${entry.url} — field "${entry.field}" changed: ${JSON.stringify(entry.previous)} → ${JSON.stringify(entry.current)}`;
}
