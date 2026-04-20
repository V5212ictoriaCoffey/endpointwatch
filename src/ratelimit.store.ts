/**
 * Rate limit store: tracks per-endpoint request counts within a sliding window.
 */

export interface RateLimitEntry {
  url: string;
  count: number;
  windowStart: number;
  windowMs: number;
  limit: number;
}

export interface RateLimitStore {
  entries: Map<string, RateLimitEntry>;
}

export function createRateLimitStore(): RateLimitStore {
  return { entries: new Map() };
}

export function getOrCreate(
  store: RateLimitStore,
  url: string,
  windowMs: number,
  limit: number,
  now = Date.now()
): RateLimitEntry {
  let entry = store.entries.get(url);
  if (!entry || now - entry.windowStart >= entry.windowMs) {
    entry = { url, count: 0, windowStart: now, windowMs, limit };
    store.entries.set(url, entry);
  }
  return entry;
}

export function increment(
  store: RateLimitStore,
  url: string,
  windowMs: number,
  limit: number,
  now = Date.now()
): RateLimitEntry {
  const entry = getOrCreate(store, url, windowMs, limit, now);
  entry.count += 1;
  return entry;
}

export function isAllowed(
  store: RateLimitStore,
  url: string,
  windowMs: number,
  limit: number,
  now = Date.now()
): boolean {
  const entry = getOrCreate(store, url, windowMs, limit, now);
  return entry.count < limit;
}

export function resetEntry(store: RateLimitStore, url: string): void {
  store.entries.delete(url);
}

export function resetAll(store: RateLimitStore): void {
  store.entries.clear();
}

export function rateLimitStoreSummary(store: RateLimitStore): string {
  const lines: string[] = [];
  for (const [url, entry] of store.entries) {
    const remaining = Math.max(0, entry.limit - entry.count);
    lines.push(`${url}: ${entry.count}/${entry.limit} (${remaining} remaining)`);
  }
  return lines.length ? lines.join('\n') : 'No rate limit entries.';
}
