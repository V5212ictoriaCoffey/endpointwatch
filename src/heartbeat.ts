export interface HeartbeatEntry {
  url: string;
  timestamp: number;
  ok: boolean;
  latencyMs: number;
}

export interface HeartbeatStore {
  entries: Map<string, HeartbeatEntry[]>;
  windowMs: number;
}

export function createHeartbeatStore(windowMs = 60_000): HeartbeatStore {
  return { entries: new Map(), windowMs };
}

export function recordHeartbeat(store: HeartbeatStore, entry: HeartbeatEntry): void {
  const list = store.entries.get(entry.url) ?? [];
  list.push(entry);
  store.entries.set(entry.url, pruneOld(list, entry.timestamp - store.windowMs));
}

function pruneOld(entries: HeartbeatEntry[], cutoff: number): HeartbeatEntry[] {
  return entries.filter(e => e.timestamp >= cutoff);
}

export function getHeartbeats(store: HeartbeatStore, url: string): HeartbeatEntry[] {
  return store.entries.get(url) ?? [];
}

export function heartbeatUptime(store: HeartbeatStore, url: string): number {
  const list = getHeartbeats(store, url);
  if (list.length === 0) return 1;
  const ok = list.filter(e => e.ok).length;
  return ok / list.length;
}

export function lastHeartbeat(store: HeartbeatStore, url: string): HeartbeatEntry | undefined {
  const list = getHeartbeats(store, url);
  return list[list.length - 1];
}

export function clearHeartbeats(store: HeartbeatStore, url?: string): void {
  if (url) store.entries.delete(url);
  else store.entries.clear();
}
