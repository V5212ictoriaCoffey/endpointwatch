import {
  createSnapshotStore,
  addSnapshot,
  getSnapshots,
  latestSnapshot,
  clearSnapshots,
  snapshotFromResult,
  Snapshot,
} from './snapshot';
import { diffSnapshots, formatDiff, hasMeaningfulChange } from './snapshot.diff';
import { serializeStore, deserializeStore } from './snapshot.persist';

function makeSnap(overrides: Partial<Snapshot> = {}): Snapshot {
  return { timestamp: 1000, url: 'http://example.com', statusCode: 200, latencyMs: 50, ok: true, ...overrides };
}

describe('snapshot store', () => {
  it('adds and retrieves snapshots', () => {
    const store = createSnapshotStore();
    addSnapshot(store, makeSnap());
    expect(getSnapshots(store, 'http://example.com')).toHaveLength(1);
  });

  it('respects maxPerUrl', () => {
    const store = createSnapshotStore(3);
    for (let i = 0; i < 5; i++) addSnapshot(store, makeSnap({ timestamp: i }));
    expect(getSnapshots(store, 'http://example.com')).toHaveLength(3);
  });

  it('returns latest snapshot', () => {
    const store = createSnapshotStore();
    addSnapshot(store, makeSnap({ timestamp: 1 }));
    addSnapshot(store, makeSnap({ timestamp: 2 }));
    expect(latestSnapshot(store, 'http://example.com')?.timestamp).toBe(2);
  });

  it('clears by url', () => {
    const store = createSnapshotStore();
    addSnapshot(store, makeSnap());
    clearSnapshots(store, 'http://example.com');
    expect(getSnapshots(store, 'http://example.com')).toHaveLength(0);
  });

  it('snapshotFromResult sets timestamp', () => {
    const snap = snapshotFromResult({ url: 'http://x.com', statusCode: 200, latencyMs: 10, ok: true });
    expect(snap.timestamp).toBeGreaterThan(0);
  });
});

describe('snapshot diff', () => {
  it('detects status change', () => {
    const d = diffSnapshots(makeSnap({ statusCode: 200 }), makeSnap({ statusCode: 500 }));
    expect(d.statusChanged).toBe(true);
  });

  it('calculates latency delta', () => {
    const d = diffSnapshots(makeSnap({ latencyMs: 100 }), makeSnap({ latencyMs: 250 }));
    expect(d.latencyDeltaMs).toBe(150);
  });

  it('formatDiff includes url', () => {
    const d = diffSnapshots(makeSnap(), makeSnap({ latencyMs: 200 }));
    expect(formatDiff(d)).toContain('http://example.com');
  });

  it('hasMeaningfulChange with large latency', () => {
    const d = diffSnapshots(makeSnap({ latencyMs: 50 }), makeSnap({ latencyMs: 300 }));
    expect(hasMeaningfulChange(d)).toBe(true);
  });
});

describe('snapshot persist', () => {
  it('round-trips store through serialize/deserialize', () => {
    const store = createSnapshotStore();
    addSnapshot(store, makeSnap());
    const json = serializeStore(store);
    const restored = deserializeStore(json, 100);
    expect(getSnapshots(restored, 'http://example.com')).toHaveLength(1);
  });
});
