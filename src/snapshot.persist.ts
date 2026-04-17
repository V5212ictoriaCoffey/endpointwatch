import * as fs from 'fs';
import { Snapshot, SnapshotStore, addSnapshot, createSnapshotStore } from './snapshot';

export function serializeStore(store: SnapshotStore): string {
  const obj: Record<string, Snapshot[]> = {};
  store.snapshots.forEach((v, k) => { obj[k] = v; });
  return JSON.stringify(obj, null, 2);
}

export function deserializeStore(json: string, maxPerUrl: number): SnapshotStore {
  const store = createSnapshotStore(maxPerUrl);
  const obj = JSON.parse(json) as Record<string, Snapshot[]>;
  for (const [, snaps] of Object.entries(obj)) {
    for (const snap of snaps) addSnapshot(store, snap);
  }
  return store;
}

export function saveStore(path: string, store: SnapshotStore): void {
  fs.writeFileSync(path, serializeStore(store), 'utf-8');
}

export function loadStore(path: string, maxPerUrl = 100): SnapshotStore {
  if (!fs.existsSync(path)) return createSnapshotStore(maxPerUrl);
  const raw = fs.readFileSync(path, 'utf-8');
  return deserializeStore(raw, maxPerUrl);
}
