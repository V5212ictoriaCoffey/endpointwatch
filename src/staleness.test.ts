import {
  createStalenessStore,
  recordSeen,
  checkStaleness,
  checkAllStaleness,
  getStaleurls,
  formatStaleness,
} from './staleness';

const BASE = 1_000_000;
const makeStore = (thresholdMs = 5000, now = BASE) =>
  createStalenessStore({ thresholdMs, now: () => now });

describe('createStalenessStore', () => {
  it('initializes with empty map', () => {
    const store = makeStore();
    expect(store.lastSeen.size).toBe(0);
  });
});

describe('recordSeen', () => {
  it('records current time for url', () => {
    const store = makeStore(5000, BASE);
    recordSeen(store, 'http://a.com');
    expect(store.lastSeen.get('http://a.com')).toBe(BASE);
  });
});

describe('checkStaleness', () => {
  it('returns not stale when recently seen', () => {
    const store = makeStore(5000, BASE + 1000);
    store.lastSeen.set('http://a.com', BASE);
    const result = checkStaleness(store, 'http://a.com');
    expect(result.isStale).toBe(false);
    expect(result.staleDurationMs).toBe(0);
  });

  it('returns stale when threshold exceeded', () => {
    const store = makeStore(5000, BASE + 6000);
    store.lastSeen.set('http://a.com', BASE);
    const result = checkStaleness(store, 'http://a.com');
    expect(result.isStale).toBe(true);
    expect(result.staleDurationMs).toBe(1000);
  });

  it('treats never-seen url as stale', () => {
    const store = makeStore(5000, BASE + 10000);
    const result = checkStaleness(store, 'http://unseen.com');
    expect(result.isStale).toBe(true);
    expect(result.lastSeenAt).toBe(0);
  });
});

describe('checkAllStaleness', () => {
  it('returns entries for all urls', () => {
    const store = makeStore(5000, BASE + 6000);
    store.lastSeen.set('http://a.com', BASE);
    store.lastSeen.set('http://b.com', BASE + 2000);
    const results = checkAllStaleness(store, ['http://a.com', 'http://b.com']);
    expect(results).toHaveLength(2);
    expect(results[0].isStale).toBe(true);
    expect(results[1].isStale).toBe(false);
  });
});

describe('getStaleurls', () => {
  it('returns only stale urls', () => {
    const store = makeStore(5000, BASE + 6000);
    store.lastSeen.set('http://a.com', BASE);
    store.lastSeen.set('http://b.com', BASE + 2000);
    const stale = getStaleurls(store, ['http://a.com', 'http://b.com']);
    expect(stale).toEqual(['http://a.com']);
  });
});

describe('formatStaleness', () => {
  it('formats a healthy entry', () => {
    const store = makeStore(5000, BASE + 1000);
    store.lastSeen.set('http://a.com', BASE);
    const entry = checkStaleness(store, 'http://a.com');
    expect(formatStaleness(entry)).toMatch(/\[ok\]/);
  });

  it('formats a stale entry with duration', () => {
    const store = makeStore(5000, BASE + 8000);
    store.lastSeen.set('http://a.com', BASE);
    const entry = checkStaleness(store, 'http://a.com');
    const line = formatStaleness(entry);
    expect(line).toMatch(/\[stale\]/);
    expect(line).toMatch(/3s/);
  });

  it('formats never-seen as never', () => {
    const store = makeStore(5000, BASE + 10000);
    const entry = checkStaleness(store, 'http://new.com');
    expect(formatStaleness(entry)).toMatch(/never/);
  });
});
