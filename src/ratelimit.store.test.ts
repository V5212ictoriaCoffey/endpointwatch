import {
  createRateLimitStore,
  getOrCreate,
  increment,
  isAllowed,
  resetEntry,
  resetAll,
  rateLimitStoreSummary,
} from './ratelimit.store';

const WINDOW = 1000;
const MAX = 3;

function makeStore() {
  return createRateLimitStore(WINDOW, MAX);
}

describe('createRateLimitStore', () => {
  it('initializes with correct config', () => {
    const store = makeStore();
    expect(store.windowMs).toBe(WINDOW);
    expect(store.maxRequests).toBe(MAX);
    expect(store.entries.size).toBe(0);
  });
});

describe('getOrCreate', () => {
  it('creates a new entry if none exists', () => {
    const store = makeStore();
    const entry = getOrCreate(store, 'http://a.com', 1000);
    expect(entry.url).toBe('http://a.com');
    expect(entry.count).toBe(0);
    expect(entry.windowStart).toBe(1000);
  });

  it('returns existing entry without resetting', () => {
    const store = makeStore();
    const e1 = getOrCreate(store, 'http://a.com', 1000);
    e1.count = 2;
    const e2 = getOrCreate(store, 'http://a.com', 1050);
    expect(e2.count).toBe(2);
  });
});

describe('increment', () => {
  it('increments count within window', () => {
    const store = makeStore();
    increment(store, 'http://a.com', 1000);
    increment(store, 'http://a.com', 1100);
    const entry = increment(store, 'http://a.com', 1200);
    expect(entry.count).toBe(3);
  });

  it('resets count when window expires', () => {
    const store = makeStore();
    increment(store, 'http://a.com', 1000);
    increment(store, 'http://a.com', 1100);
    const entry = increment(store, 'http://a.com', 2001);
    expect(entry.count).toBe(1);
    expect(entry.windowStart).toBe(2001);
  });

  it('tracks multiple urls independently', () => {
    const store = makeStore();
    increment(store, 'http://a.com', 1000);
    increment(store, 'http://a.com', 1100);
    increment(store, 'http://b.com', 1000);
    const entryA = increment(store, 'http://a.com', 1200);
    const entryB = increment(store, 'http://b.com', 1200);
    expect(entryA.count).toBe(3);
    expect(entryB.count).toBe(2);
  });
});

describe('isAllowed', () => {
  it('allows requests under the limit', () => {
    const store = makeStore();
    increment(store, 'http://a.com', 1000);
    increment(store, 'http://a.com', 1100);
    expect(isAllowed(store, 'http://a.com', 1200)).toBe(true);
  });

  it('blocks requests at the limit', () => {
    const store = makeStore();
    for (let i = 0; i < MAX; i++) increment(store, 'http://a.com', 1000 + i * 10);
    expect(isAllowed(store, 'http://a.com', 1100)).toBe(false);
  });

  it('allows after window resets', () => {
    const store = makeStore();
    for (let i = 0; i < MAX; i++) increment(store, 'http://a.com', 1000 + i * 10);
    expect(isAllowed(store, 'http://a.com', 2001)).toBe(true);
  });

  it('allows new url with no history', () => {
    const store = makeStore();
    expect(isAllowed(store, 'http://new.com', 1000)).toBe(true);
  });
});

describe('resetEntry', () => {
  it('removes the entry for a url', () => {
    const store = makeStore();
    increment(store, 'http://a.com', 1000);
    resetEntry(store, 'http://a.com');
    expect(store.entries.has('http://a.com')).toBe(false);
  });

  it('is a no-op for unknown url', () => {
    const store = makeStore();
    expect(() => resetEntry(store, 'http://unknown.com')).not.toThrow();
  });
});

describe('resetAll', () => {
  it('clears all entries from the store', () => {
    const store = makeStore();
    increment(store, 'http://a.com', 1000);
    increment(store, 'http://b.com', 1000);
    resetAll(store);
    expect(store.entries.size).toBe(0);
  });

  it('is a no-op on an already empty store', () => {
    const store = makeStore();
    expect(() => resetAll(store)).not.toThrow();
    expect(store.entries.size).toBe(0);
  });
});

describe('rateLimitStoreSummary', () => {
  it('returns a summary of all tracked urls', () => {
    const store = makeStore();
    increment(store, 'http://a.com', 1000);
    increment(store, 'http://a.com', 1100);
    increment(store, 'http://b.com', 1000);
    const summary = rateLimitStoreSummary(store);
    expect(summary).toHaveLength(2);
    const entryA = summary.find((s) => s.url === 'http://a.com');
    expect(entryA?.count).toBe(2);
  });
});
