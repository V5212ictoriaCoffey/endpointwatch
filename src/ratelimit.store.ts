export interface RateLimitEntry {
  url: string;
  count: number;
  windowStart: number;
}

export interface RateLimitStore {
  entries: Map<string, RateLimitEntry>;
  windowMs: number;
  maxRequests: number;
}

export function createRateLimitStore(windowMs: number, maxRequests: number): RateLimitStore {
  return {
    entries: new Map(),
    windowMs,
    maxRequests,
  };
}

export function getOrCreate(store: RateLimitStore, url: string, now = Date.now()): RateLimitEntry {
  if (!store.entries.has(url)) {
    store.entries.set(url, { url, count: 0, windowStart: now });
  }
  return store.entries.get(url)!;
}

export function increment(store: RateLimitStore, url: string, now = Date.now()): RateLimitEntry {
  const entry = getOrCreate(store, url, now);
  if (now - entry.windowStart >= store.windowMs) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count += 1;
  return entry;
}

export function isAllowed(store: RateLimitStore, url: string, now = Date.now()): boolean {
  const entry = getOrCreate(store, url, now);
  if (now - entry.windowStart >= store.windowMs) {
    return true;
  }
  return entry.count < store.maxRequests;
}

export function resetEntry(store: RateLimitStore, url: string): void {
  store.entries.delete(url);
}

export function resetAll(store: RateLimitStore): void {
  store.entries.clear();
}

export function rateLimitStoreSummary(store: RateLimitStore): string {
  const lines: string[] = [`RateLimitStore: windowMs=${store.windowMs}, maxRequests=${store.maxRequests}`];
  for (const [url, entry] of store.entries) {
    lines.push(`  ${url}: count=${entry.count}, windowStart=${entry.windowStart}`);
  }
  return lines.join('\n');
}
