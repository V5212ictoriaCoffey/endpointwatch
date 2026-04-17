import { buildDigest, computeP95, formatDigest, buildAllDigests } from './digest';
import { createStore, addEntry } from './history';
import type { HistoryStore } from './history';

function makeStore(entries: { latency: number; status: number; error?: boolean }[]): HistoryStore {
  const store = createStore();
  entries.forEach(({ latency, status, error }) => {
    addEntry(store, { timestamp: Date.now(), latency, status, error: !!error, url: 'http://x' });
  });
  return store;
}

describe('computeP95', () => {
  it('returns 0 for empty array', () => {
    expect(computeP95([])).toBe(0);
  });

  it('returns correct p95 for sorted values', () => {
    const vals = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(computeP95(vals)).toBe(95);
  });

  it('handles single element', () => {
    expect(computeP95([42])).toBe(42);
  });
});

describe('buildDigest', () => {
  it('returns zero values for empty store', () => {
    const store = createStore();
    const digest = buildDigest('http://api/health', store);
    expect(digest.totalRequests).toBe(0);
    expect(digest.avgLatency).toBe(0);
    expect(digest.errorRate).toBe(0);
    expect(digest.p95Latency).toBe(0);
  });

  it('computes correct metrics', () => {
    const store = makeStore([
      { latency: 100, status: 200 },
      { latency: 200, status: 200 },
      { latency: 300, status: 500, error: true },
    ]);
    const digest = buildDigest('http://api', store);
    expect(digest.totalRequests).toBe(3);
    expect(digest.avgLatency).toBeCloseTo(200);
    expect(digest.errorRate).toBeCloseTo(1 / 3);
    expect(digest.minLatency).toBe(100);
    expect(digest.maxLatency).toBe(300);
  });
});

describe('formatDigest', () => {
  it('includes endpoint and key labels', () => {
    const store = makeStore([{ latency: 150, status: 200 }]);
    const digest = buildDigest('http://test', store);
    const output = formatDigest(digest);
    expect(output).toContain('http://test');
    expect(output).toContain('Requests');
    expect(output).toContain('Error Rate');
    expect(output).toContain('P95');
  });
});

describe('buildAllDigests', () => {
  it('returns one digest per store', () => {
    const stores = new Map<string, HistoryStore>([
      ['http://a', makeStore([{ latency: 100, status: 200 }])],
      ['http://b', makeStore([{ latency: 200, status: 200 }])],
    ]);
    const digests = buildAllDigests(stores);
    expect(digests).toHaveLength(2);
    expect(digests.map(d => d.endpoint)).toContain('http://a');
  });
});
