import {
  createRateLimitStore,
  consumeToken,
  getRateLimitStats,
  resetRateLimitStore,
  refillTokens,
  getOrCreateEntry,
} from './ratelimit.store';
import type { RateLimitOptions } from './ratelimit';

function makeStore(overrides: Partial<RateLimitOptions> = {}) {
  const options: RateLimitOptions = {
    maxRequests: 3,
    windowMs: 1000,
    ...overrides,
  };
  return createRateLimitStore(options);
}

describe('createRateLimitStore', () => {
  it('creates an empty store with given options', () => {
    const store = makeStore();
    expect(store.entries.size).toBe(0);
    expect(store.options.maxRequests).toBe(3);
  });
});

describe('consumeToken', () => {
  it('allows requests up to maxRequests', () => {
    const store = makeStore({ maxRequests: 2 });
    expect(consumeToken(store, 'http://a.com')).toBe(true);
    expect(consumeToken(store, 'http://a.com')).toBe(true);
    expect(consumeToken(store, 'http://a.com')).toBe(false);
  });

  it('tracks totalAllowed and totalDropped', () => {
    const store = makeStore({ maxRequests: 1 });
    consumeToken(store, 'http://b.com');
    consumeToken(store, 'http://b.com');
    const stats = getRateLimitStats(store, 'http://b.com');
    expect(stats?.totalAllowed).toBe(1);
    expect(stats?.totalDropped).toBe(1);
  });

  it('handles multiple urls independently', () => {
    const store = makeStore({ maxRequests: 1 });
    expect(consumeToken(store, 'http://x.com')).toBe(true);
    expect(consumeToken(store, 'http://y.com')).toBe(true);
    expect(consumeToken(store, 'http://x.com')).toBe(false);
    expect(consumeToken(store, 'http://y.com')).toBe(false);
  });
});

describe('refillTokens', () => {
  it('refills tokens after window has elapsed', () => {
    const store = makeStore({ maxRequests: 2, windowMs: 500 });
    const entry = getOrCreateEntry(store, 'http://c.com');
    entry.tokens = 0;
    entry.lastRefill = Date.now() - 600;
    refillTokens(entry, store.options);
    expect(entry.tokens).toBe(2);
  });

  it('does not refill before window elapses', () => {
    const store = makeStore({ maxRequests: 2, windowMs: 5000 });
    const entry = getOrCreateEntry(store, 'http://d.com');
    entry.tokens = 0;
    entry.lastRefill = Date.now() - 100;
    refillTokens(entry, store.options);
    expect(entry.tokens).toBe(0);
  });
});

describe('getRateLimitStats', () => {
  it('returns null for unknown url', () => {
    const store = makeStore();
    expect(getRateLimitStats(store, 'http://unknown.com')).toBeNull();
  });

  it('returns stats after activity', () => {
    const store = makeStore({ maxRequests: 5 });
    consumeToken(store, 'http://e.com');
    const stats = getRateLimitStats(store, 'http://e.com');
    expect(stats).not.toBeNull();
    expect(stats!.tokens).toBe(4);
  });
});

describe('resetRateLimitStore', () => {
  it('resets a single url', () => {
    const store = makeStore();
    consumeToken(store, 'http://f.com');
    resetRateLimitStore(store, 'http://f.com');
    expect(store.entries.has('http://f.com')).toBe(false);
  });

  it('resets all entries when no url given', () => {
    const store = makeStore();
    consumeToken(store, 'http://g.com');
    consumeToken(store, 'http://h.com');
    resetRateLimitStore(store);
    expect(store.entries.size).toBe(0);
  });
});
