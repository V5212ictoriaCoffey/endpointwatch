import { describe, it, expect } from 'vitest';
import { createStore, addEntry } from './history';
import { replayEntries, formatReplay } from './replay';
import { applyReplayDefaults, parseReplayConfig, replaySummary } from './replay.config';

function makeEntry(url: string, status: number, latency: number, timestamp: number) {
  return { url, status, latency, timestamp, ok: status < 400 };
}

describe('replayEntries', () => {
  it('returns all entries when no options given', () => {
    const store = createStore();
    addEntry(store, makeEntry('http://a.com', 200, 100, 1000));
    addEntry(store, makeEntry('http://b.com', 500, 200, 2000));
    const result = replayEntries(store);
    expect(result.count).toBe(2);
  });

  it('filters by endpointUrl', () => {
    const store = createStore();
    addEntry(store, makeEntry('http://a.com', 200, 100, 1000));
    addEntry(store, makeEntry('http://b.com', 200, 150, 2000));
    const result = replayEntries(store, { endpointUrl: 'http://a.com' });
    expect(result.count).toBe(1);
    expect(result.entries[0].url).toBe('http://a.com');
  });

  it('filters by from/to timestamps', () => {
    const store = createStore();
    addEntry(store, makeEntry('http://a.com', 200, 100, 1000));
    addEntry(store, makeEntry('http://a.com', 200, 120, 3000));
    addEntry(store, makeEntry('http://a.com', 200, 130, 5000));
    const result = replayEntries(store, { from: 2000, to: 4000 });
    expect(result.count).toBe(1);
    expect(result.entries[0].timestamp).toBe(3000);
  });

  it('respects limit', () => {
    const store = createStore();
    for (let i = 0; i < 10; i++) addEntry(store, makeEntry('http://a.com', 200, 100, i * 100));
    const result = replayEntries(store, { limit: 3 });
    expect(result.count).toBe(3);
  });

  it('returns null from/to when empty', () => {
    const store = createStore();
    const result = replayEntries(store);
    expect(result.from).toBeNull();
    expect(result.to).toBeNull();
  });

  it('sets from/to based on first and last entry timestamps', () => {
    const store = createStore();
    addEntry(store, makeEntry('http://a.com', 200, 100, 1000));
    addEntry(store, makeEntry('http://a.com', 200, 120, 2000));
    addEntry(store, makeEntry('http://a.com', 200, 130, 3000));
    const result = replayEntries(store);
    expect(result.from).toBe(1000);
    expect(result.to).toBe(3000);
  });
});

describe('formatReplay', () => {
  it('returns message when no entries', () => {
    expect(formatReplay({ entries: [], count: 0, from: null, to: null })).toMatch(/No entries/);
  });

  it('formats entries as lines', () => {
    const store = createStore();
    addEntry(store, makeEntry('http://a.com', 200, 50, Date.now()));
    const result = replayEntries(store);
    const out = formatReplay(result);
    expect(out).toContain('http://a.com');
    expect(out).toContain('200');
  });
});

describe('replayConfig', () => {
  it('parses raw config', () => {
    const cfg = parseReplayConfig({ limit: 50, endpointUrl: 'http://x.com' });
    expect(cfg.limit).toBe(50);
  });

  it('applies defaults', () => {
    const opts = applyReplayDefaults({});
    expect(opts.limit).toBe(100);
  });

  it('replaySummary includes fields', () => {
    const s = replaySummary({ limit: 10, endpointUrl: 'http://x.com' });
    expect(s).toContain('limit=10');
    expect(s).toContain('url=http://x.com');
  });
});
