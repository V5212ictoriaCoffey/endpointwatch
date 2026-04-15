import {
  createStore,
  addEntry,
  getEntries,
  averageLatency,
  errorRate,
  clearHistory,
} from './history';
import { ReportEntry } from './reporter';

function makeEntry(overrides: Partial<ReportEntry> = {}): ReportEntry {
  return {
    timestamp: new Date().toISOString(),
    endpoint: 'https://api.example.com/health',
    statusCode: 200,
    latencyMs: 100,
    ok: true,
    alerts: [],
    ...overrides,
  };
}

describe('createStore', () => {
  it('creates an empty store with default maxSize', () => {
    const store = createStore();
    expect(store.entries).toHaveLength(0);
    expect(store.maxSize).toBe(500);
  });
});

describe('addEntry', () => {
  it('appends entries to the store', () => {
    const store = createStore();
    addEntry(store, makeEntry());
    expect(store.entries).toHaveLength(1);
  });

  it('evicts oldest entry when maxSize is exceeded', () => {
    const store = createStore(2);
    addEntry(store, makeEntry({ latencyMs: 10 }));
    addEntry(store, makeEntry({ latencyMs: 20 }));
    addEntry(store, makeEntry({ latencyMs: 30 }));
    expect(store.entries).toHaveLength(2);
    expect(store.entries[0].latencyMs).toBe(20);
  });
});

describe('getEntries', () => {
  it('returns all entries when no endpoint filter is given', () => {
    const store = createStore();
    addEntry(store, makeEntry({ endpoint: 'https://a.com' }));
    addEntry(store, makeEntry({ endpoint: 'https://b.com' }));
    expect(getEntries(store)).toHaveLength(2);
  });

  it('filters entries by endpoint', () => {
    const store = createStore();
    addEntry(store, makeEntry({ endpoint: 'https://a.com' }));
    addEntry(store, makeEntry({ endpoint: 'https://b.com' }));
    expect(getEntries(store, 'https://a.com')).toHaveLength(1);
  });
});

describe('averageLatency', () => {
  it('returns null for empty store', () => {
    expect(averageLatency(createStore())).toBeNull();
  });

  it('calculates the average latency', () => {
    const store = createStore();
    addEntry(store, makeEntry({ latencyMs: 100 }));
    addEntry(store, makeEntry({ latencyMs: 200 }));
    expect(averageLatency(store)).toBe(150);
  });
});

describe('errorRate', () => {
  it('returns 0 for empty store', () => {
    expect(errorRate(createStore())).toBe(0);
  });

  it('calculates fraction of failed requests', () => {
    const store = createStore();
    addEntry(store, makeEntry({ ok: true }));
    addEntry(store, makeEntry({ ok: false }));
    addEntry(store, makeEntry({ ok: false }));
    expect(errorRate(store)).toBeCloseTo(0.667, 2);
  });
});

describe('clearHistory', () => {
  it('removes all entries from the store', () => {
    const store = createStore();
    addEntry(store, makeEntry());
    clearHistory(store);
    expect(store.entries).toHaveLength(0);
  });
});
