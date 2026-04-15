/**
 * Simple in-memory response cache for avoiding redundant requests
 * within a short TTL window.
 */

export interface CacheEntry {
  statusCode: number;
  latencyMs: number;
  timestamp: number;
  ok: boolean;
}

export interface CacheStore {
  entries: Map<string, CacheEntry>;
  ttlMs: number;
}

export function createCacheStore(ttlMs = 5000): CacheStore {
  return { entries: new Map(), ttlMs };
}

export function getCached(store: CacheStore, url: string): CacheEntry | null {
  const entry = store.entries.get(url);
  if (!entry) return null;
  const age = Date.now() - entry.timestamp;
  if (age > store.ttlMs) {
    store.entries.delete(url);
    return null;
  }
  return entry;
}

export function setCached(store: CacheStore, url: string, entry: Omit<CacheEntry, 'timestamp'>): void {
  store.entries.set(url, { ...entry, timestamp: Date.now() });
}

export function invalidate(store: CacheStore, url: string): void {
  store.entries.delete(url);
}

export function invalidateAll(store: CacheStore): void {
  store.entries.clear();
}

export function cacheSize(store: CacheStore): number {
  return store.entries.size;
}

export function parseCacheTtl(raw: unknown, defaultMs = 5000): number {
  if (typeof raw === 'number' && raw > 0) return raw;
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n > 0) return n;
  }
  return defaultMs;
}
