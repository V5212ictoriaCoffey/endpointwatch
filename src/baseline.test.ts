import {
  createBaselineStore,
  captureBaseline,
  getBaseline,
  deviatesFromBaseline,
  clearBaseline,
  baselineSummary,
} from './baseline';
import { createStore, addEntry } from './history';

function makeEntry(url: string, latency: number, error = false) {
  return { url, latency, status: error ? 0 : 200, timestamp: Date.now(), error };
}

test('captureBaseline stores stats for url', () => {
  const history = createStore();
  const url = 'http://example.com';
  addEntry(history, makeEntry(url, 100));
  addEntry(history, makeEntry(url, 200));
  const bStore = createBaselineStore();
  const stats = captureBaseline(bStore, history, url);
  expect(stats.url).toBe(url);
  expect(stats.avgLatency).toBe(150);
  expect(stats.sampleSize).toBe(2);
});

test('getBaseline returns undefined for unknown url', () => {
  const bStore = createBaselineStore();
  expect(getBaseline(bStore, 'http://unknown.com')).toBeUndefined();
});

test('deviatesFromBaseline returns false when no baseline', () => {
  const bStore = createBaselineStore();
  expect(deviatesFromBaseline(bStore, 'http://x.com', 999)).toBe(false);
});

test('deviatesFromBaseline detects large deviation', () => {
  const history = createStore();
  const url = 'http://example.com';
  addEntry(history, makeEntry(url, 100));
  addEntry(history, makeEntry(url, 100));
  const bStore = createBaselineStore();
  captureBaseline(bStore, history, url);
  expect(deviatesFromBaseline(bStore, url, 200, 0.5)).toBe(true);
});

test('deviatesFromBaseline passes for small deviation', () => {
  const history = createStore();
  const url = 'http://example.com';
  addEntry(history, makeEntry(url, 100));
  addEntry(history, makeEntry(url, 100));
  const bStore = createBaselineStore();
  captureBaseline(bStore, history, url);
  expect(deviatesFromBaseline(bStore, url, 110, 0.5)).toBe(false);
});

test('clearBaseline removes entry', () => {
  const history = createStore();
  const url = 'http://example.com';
  addEntry(history, makeEntry(url, 100));
  const bStore = createBaselineStore();
  captureBaseline(bStore, history, url);
  clearBaseline(bStore, url);
  expect(getBaseline(bStore, url)).toBeUndefined();
});

test('clearBaseline is a no-op for unknown url', () => {
  const bStore = createBaselineStore();
  expect(() => clearBaseline(bStore, 'http://unknown.com')).not.toThrow();
});

test('baselineSummary formats correctly', () => {
  const stats = { url: 'http://x.com', avgLatency: 123.4, errorRate: 0.05, sampleSize: 10, capturedAt: 0 };
  const s = baselineSummary(stats);
  expect(s).toContain('123.4ms');
  expect(s).toContain('5.0%');
  expect(s).toContain('n=10');
});
