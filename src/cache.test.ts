import {
  createCacheStore,
  getCached,
  setCached,
  invalidate,
  invalidateAll,
  cacheSize,
  parseCacheTtl,
} from './cache';
import { parseCacheConfig, applyCacheDefaults, cacheSummary } from './cache.config';

function makeEntry(overrides = {}) {
  return { statusCode: 200, latencyMs: 120, ok: true, ...overrides };
}

describe('createCacheStore', () => {
  it('creates store with default ttl', () => {
    const store = createCacheStore();
    expect(store.ttlMs).toBe(5000);
    expect(store.entries.size).toBe(0);
  });

  it('respects custom ttl', () => {
    const store = createCacheStore(2000);
    expect(store.ttlMs).toBe(2000);
  });
});

describe('getCached / setCached', () => {
  it('returns null for missing entry', () => {
    const store = createCacheStore();
    expect(getCached(store, 'http://example.com')).toBeNull();
  });

  it('returns cached entry within ttl', () => {
    const store = createCacheStore(5000);
    setCached(store, 'http://example.com', makeEntry());
    const result = getCached(store, 'http://example.com');
    expect(result).not.toBeNull();
    expect(result?.statusCode).toBe(200);
  });

  it('returns null and evicts expired entry', () => {
    const store = createCacheStore(1);
    setCached(store, 'http://example.com', makeEntry());
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        expect(getCached(store, 'http://example.com')).toBeNull();
        expect(cacheSize(store)).toBe(0);
        resolve();
      }, 10)
    );
  });
});

describe('invalidate / invalidateAll', () => {
  it('removes a single entry', () => {
    const store = createCacheStore();
    setCached(store, 'http://a.com', makeEntry());
    setCached(store, 'http://b.com', makeEntry());
    invalidate(store, 'http://a.com');
    expect(cacheSize(store)).toBe(1);
  });

  it('clears all entries', () => {
    const store = createCacheStore();
    setCached(store, 'http://a.com', makeEntry());
    setCached(store, 'http://b.com', makeEntry());
    invalidateAll(store);
    expect(cacheSize(store)).toBe(0);
  });
});

describe('parseCacheTtl', () => {
  it('parses number', () => expect(parseCacheTtl(3000)).toBe(3000));
  it('parses string', () => expect(parseCacheTtl('2000')).toBe(2000));
  it('falls back to default', () => expect(parseCacheTtl(undefined)).toBe(5000));
});

describe('parseCacheConfig', () => {
  it('returns disabled config when undefined', () => {
    expect(parseCacheConfig(undefined)).toEqual({ enabled: false, ttlMs: 5000 });
  });

  it('parses enabled config with ttlMs', () => {
    expect(parseCacheConfig({ enabled: true, ttlMs: 3000 })).toEqual({ enabled: true, ttlMs: 3000 });
  });
});

describe('cacheSummary', () => {
  it('shows disabled', () => expect(cacheSummary({ enabled: false, ttlMs: 5000 })).toContain('disabled'));
  it('shows ttl when enabled', () => expect(cacheSummary({ enabled: true, ttlMs: 2000 })).toContain('2000ms'));
});
