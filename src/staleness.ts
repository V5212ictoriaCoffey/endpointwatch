/**
 * staleness.ts — Detect and report stale endpoints based on last-seen time
 */

export interface StalenessOptions {
  thresholdMs: number;
  now?: () => number;
}

export interface StalenessEntry {
  url: string;
  lastSeenAt: number;
  staleAt: number;
  isStale: boolean;
  staleDurationMs: number;
}

export interface StalenessStore {
  lastSeen: Map<string, number>;
  options: StalenessOptions;
}

export function createStalenessStore(options: StalenessOptions): StalenessStore {
  return {
    lastSeen: new Map(),
    options,
  };
}

export function recordSeen(store: StalenessStore, url: string): void {
  const now = store.options.now ? store.options.now() : Date.now();
  store.lastSeen.set(url, now);
}

export function checkStaleness(store: StalenessStore, url: string): StalenessEntry {
  const now = store.options.now ? store.options.now() : Date.now();
  const lastSeenAt = store.lastSeen.get(url) ?? 0;
  const staleAt = lastSeenAt + store.options.thresholdMs;
  const isStale = now >= staleAt;
  const staleDurationMs = isStale ? now - staleAt : 0;
  return { url, lastSeenAt, staleAt, isStale, staleDurationMs };
}

export function checkAllStaleness(store: StalenessStore, urls: string[]): StalenessEntry[] {
  return urls.map((url) => checkStaleness(store, url));
}

export function getStaleurls(store: StalenessStore, urls: string[]): string[] {
  return checkAllStaleness(store, urls)
    .filter((e) => e.isStale)
    .map((e) => e.url);
}

export function formatStaleness(entry: StalenessEntry): string {
  if (!entry.isStale) {
    return `[ok]      ${entry.url} — last seen ${entry.lastSeenAt === 0 ? 'never' : new Date(entry.lastSeenAt).toISOString()}`;
  }
  const secs = Math.round(entry.staleDurationMs / 1000);
  return `[stale]   ${entry.url} — stale for ${secs}s (last seen ${entry.lastSeenAt === 0 ? 'never' : new Date(entry.lastSeenAt).toISOString()})`;
}
