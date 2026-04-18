import { describe, it, expect } from 'vitest';
import { computeStddev, detectAnomaly, detectAnomalies } from './anomaly';
import type { HistoryEntry } from './history';

function makeEntry(url: string, latency: number, status = 200): HistoryEntry {
  return { url, latency, status, timestamp: Date.now(), error: null };
}

describe('computeStddev', () => {
  it('returns 0 for empty array', () => {
    expect(computeStddev([])).toBe(0);
  });

  it('returns 0 for single value', () => {
    expect(computeStddev([5])).toBe(0);
  });

  it('computes correct stddev', () => {
    const result = computeStddev([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(result).toBeCloseTo(2, 0);
  });
});

describe('detectAnomaly', () => {
  const history = [100, 105, 98, 102, 101].map((l) => makeEntry('http://api/test', l));

  it('marks normal latency as non-anomaly', () => {
    const entry = makeEntry('http://api/test', 103);
    const result = detectAnomaly(entry, history);
    expect(result.isAnomaly).toBe(false);
  });

  it('marks spike as anomaly', () => {
    const entry = makeEntry('http://api/test', 500);
    const result = detectAnomaly(entry, history);
    expect(result.isAnomaly).toBe(true);
    expect(result.zScore).toBeGreaterThan(2.5);
  });

  it('returns correct endpoint', () => {
    const entry = makeEntry('http://api/test', 103);
    const result = detectAnomaly(entry, history);
    expect(result.endpoint).toBe('http://api/test');
  });
});

describe('detectAnomalies', () => {
  it('filters history by url per entry', () => {
    const h1 = [100, 102, 101].map((l) => makeEntry('http://a', l));
    const h2 = [200, 205, 198].map((l) => makeEntry('http://b', l));
    const entries = [makeEntry('http://a', 103), makeEntry('http://b', 600)];
    const results = detectAnomalies(entries, [...h1, ...h2]);
    expect(results[0].isAnomaly).toBe(false);
    expect(results[1].isAnomaly).toBe(true);
  });
});
