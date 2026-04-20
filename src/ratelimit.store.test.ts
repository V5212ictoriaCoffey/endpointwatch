import {
  createRateLimitStore,
  getOrCreate,
  increment,
  isAllowed,
  resetEntry,
  resetAll,
  rateLimitStoreSummary,
} from './ratelimit.store';

const URL = 'https://api.example.com/health';
const WINDOW_MS = 60_000;
const LIMIT = 5;

describe('createRateLimitStore', () => {
  it('creates an empty store', () => {
    const store = createRateLimitStore();
    expect(store.entries.size).toBe(0);
  });
});

describe('getOrCreate', () => {
  it('creates a new entry for an unknown url', () => {
    const store = createRateLimitStore();
    const entry = getOrCreate(store, URL, WINDOW_MS, LIMIT);
    expect(entry.url).toBe(URL);
    expect(entry.count).toBe(0);
    expect(entry.limit).toBe(LIMIT);
  });

  it('returns existing entry within window', () => {
    const store = createRateLimitStore();
    const e1 = getOrCreate(store, URL, WINDOW_MS, LIMIT, 1000);
    e1.count = 3;
    const e2 = getOrCreate(store, URL, WINDOW_MS, LIMIT, 1500);
    expect(e2.count).toBe(3);
  });

  it('resets entry when window expires', () => {
    const store = createRateLimitStore();
    const e1 = getOrCreate(store, URL, WINDOW_MS, LIMIT, 1000);
    e1.count = 4;
    const e2 = getOrCreate(store, URL, WINDOW_MS, LIMIT, 1000 + WINDOW_MS + 1);
    expect(e2.count).toBe(0);
  });
});

describe('increment', () => {
  it('increments count and returns entry', () => {
    const store = createRateLimitStore();
    const e1 = increment(store, URL, WINDOW_MS, LIMIT);
    expect(e1.count).toBe(1);
    const e2 = increment(store, URL, WINDOW_MS, LIMIT);
    expect(e2.count).toBe(2);
  });
});

describe('isAllowed', () => {
  it('returns true when under limit', () => {
    const store = createRateLimitStore();
    expect(isAllowed(store, URL, WINDOW_MS, LIMIT)).toBe(true);
  });

  it('returns false when at or over limit', () => {
    const store = createRateLimitStore();
    for (let i = 0; i < LIMIT; i++) increment(store, URL, WINDOW_MS, LIMIT);
    expect(isAllowed(store, URL, WINDOW_MS, LIMIT)).toBe(false);
  });
});

describe('resetEntry', () => {
  it('removes a specific entry', () => {
    const store = createRateLimitStore();
    increment(store, URL, WINDOW_MS, LIMIT);
    resetEntry(store, URL);
    expect(store.entries.has(URL)).toBe(false);
  });
});

describe('resetAll', () => {
  it('clears all entries', () => {
    const store = createRateLimitStore();
    increment(store, URL, WINDOW_MS, LIMIT);
    increment(store, 'https://other.example.com', WINDOW_MS, LIMIT);
    resetAll(store);
    expect(store.entries.size).toBe(0);
  });
});

describe('rateLimitStoreSummary', () => {
  it('returns a no-entries message for empty store', () => {
    const store = createRateLimitStore();
    expect(rateLimitStoreSummary(store)).toBe('No rate limit entries.');
  });

  it('formats entries with remaining counts', () => {
    const store = createRateLimitStore();
    increment(store, URL, WINDOW_MS, LIMIT);
    increment(store, URL, WINDOW_MS, LIMIT);
    const summary = rateLimitStoreSummary(store);
    expect(summary).toContain('2/5');
    expect(summary).toContain('3 remaining');
  });
});
