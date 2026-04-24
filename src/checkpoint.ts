/**
 * Checkpoint: periodic state snapshots for monitoring runs.
 * Allows resuming from the last known good state after a restart.
 */

export interface CheckpointEntry {
  id: string;
  url: string;
  lastCheckedAt: number;
  consecutiveFailures: number;
  lastStatus: number | null;
  lastLatencyMs: number | null;
  meta?: Record<string, unknown>;
}

export interface CheckpointStore {
  entries: Map<string, CheckpointEntry>;
  savedAt: number | null;
}

export function createCheckpointStore(): CheckpointStore {
  return { entries: new Map(), savedAt: null };
}

export function upsertCheckpoint(
  store: CheckpointStore,
  entry: CheckpointEntry
): void {
  store.entries.set(entry.url, { ...entry });
}

export function getCheckpoint(
  store: CheckpointStore,
  url: string
): CheckpointEntry | undefined {
  return store.entries.get(url);
}

export function removeCheckpoint(store: CheckpointStore, url: string): boolean {
  return store.entries.delete(url);
}

export function listCheckpoints(store: CheckpointStore): CheckpointEntry[] {
  return Array.from(store.entries.values());
}

export function markSaved(store: CheckpointStore): void {
  store.savedAt = Date.now();
}

export function checkpointSummary(store: CheckpointStore): string {
  const count = store.entries.size;
  const saved = store.savedAt
    ? new Date(store.savedAt).toISOString()
    : "never";
  return `checkpoint: ${count} endpoint(s) tracked, last saved at ${saved}`;
}
