import { RateLimitOptions } from './ratelimit';

export interface RateLimitEntry {
  url: string;
  tokens: number;
  lastRefill: number;
  totalAllowed: number;
  totalDropped: number;
}

export interface RateLimitStore {
  entries: Map<string, RateLimitEntry>;
  options: RateLimitOptions;
}

export function createRateLimitStore(options: RateLimitOptions): RateLimitStore {
  return { entries: new Map(), options };
}

export function getOrCreateEntry(
  store: RateLimitStore,
  url: string
): RateLimitEntry {
  if (!store.entries.has(url)) {
    store.entries.set(url, {
      url,
      tokens: store.options.maxRequests,
      lastRefill: Date.now(),
      totalAllowed: 0,
      totalDropped: 0,
    });
  }
  return store.entries.get(url)!;
}

export function refillTokens(entry: RateLimitEntry, options: RateLimitOptions): void {
  const now = Date.now();
  const elapsed = now - entry.lastRefill;
  const windowMs = options.windowMs ?? 1000;
  if (elapsed >= windowMs) {
    const windows = Math.floor(elapsed / windowMs);
    entry.tokens = Math.min(
      options.maxRequests,
      entry.tokens + windows * options.maxRequests
    );
    entry.lastRefill = now;
  }
}

export function consumeToken(
  store: RateLimitStore,
  url: string
): boolean {
  const entry = getOrCreateEntry(store, url);
  refillTokens(entry, store.options);
  if (entry.tokens > 0) {
    entry.tokens -= 1;
    entry.totalAllowed += 1;
    return true;
  }
  entry.totalDropped += 1;
  return false;
}

export function getRateLimitStats(
  store: RateLimitStore,
  url: string
): Pick<RateLimitEntry, 'tokens' | 'totalAllowed' | 'totalDropped'> | null {
  const entry = store.entries.get(url);
  if (!entry) return null;
  return {
    tokens: entry.tokens,
    totalAllowed: entry.totalAllowed,
    totalDropped: entry.totalDropped,
  };
}

export function resetRateLimitStore(store: RateLimitStore, url?: string): void {
  if (url) {
    store.entries.delete(url);
  } else {
    store.entries.clear();
  }
}
