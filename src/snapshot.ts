export interface Snapshot {
  timestamp: number;
  url: string;
  statusCode: number;
  latencyMs: number;
  ok: boolean;
}

export interface SnapshotStore {
  snapshots: Map<string, Snapshot[]>;
  maxPerUrl: number;
}

export function createSnapshotStore(maxPerUrl = 100): SnapshotStore {
  return { snapshots: new Map(), maxPerUrl };
}

export function addSnapshot(store: SnapshotStore, snap: Snapshot): void {
  const key = snap.url;
  if (!store.snapshots.has(key)) store.snapshots.set(key, []);
  const list = store.snapshots.get(key)!;
  list.push(snap);
  if (list.length > store.maxPerUrl) list.shift();
}

export function getSnapshots(store: SnapshotStore, url: string): Snapshot[] {
  return store.snapshots.get(url) ?? [];
}

export function latestSnapshot(store: SnapshotStore, url: string): Snapshot | undefined {
  const list = getSnapshots(store, url);
  return list[list.length - 1];
}

export function clearSnapshots(store: SnapshotStore, url?: string): void {
  if (url) store.snapshots.delete(url);
  else store.snapshots.clear();
}

export function snapshotFromResult(result: {
  url: string;
  statusCode: number;
  latencyMs: number;
  ok: boolean;
}): Snapshot {
  return { timestamp: Date.now(), ...result };
}
