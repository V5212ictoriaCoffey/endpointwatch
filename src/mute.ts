export interface MuteEntry {
  url: string;
  until: number; // epoch ms
  reason?: string;
}

export interface MuteStore {
  entries: Map<string, MuteEntry>;
}

export function createMuteStore(): MuteStore {
  return { entries: new Map() };
}

export function muteEndpoint(
  store: MuteStore,
  url: string,
  durationMs: number,
  reason?: string
): void {
  store.entries.set(url, { url, until: Date.now() + durationMs, reason });
}

export function unmuteEndpoint(store: MuteStore, url: string): void {
  store.entries.delete(url);
}

export function isMuted(store: MuteStore, url: string): boolean {
  const entry = store.entries.get(url);
  if (!entry) return false;
  if (Date.now() > entry.until) {
    store.entries.delete(url);
    return false;
  }
  return true;
}

export function muteAll(store: MuteStore, durationMs: number, reason?: string): void {
  for (const url of store.entries.keys()) {
    muteEndpoint(store, url, durationMs, reason);
  }
}

export function listMuted(store: MuteStore): MuteEntry[] {
  const now = Date.now();
  const result: MuteEntry[] = [];
  for (const [url, entry] of store.entries) {
    if (entry.until > now) {
      result.push(entry);
    } else {
      store.entries.delete(url);
    }
  }
  return result;
}

export function muteSummary(store: MuteStore): string {
  const muted = listMuted(store);
  if (muted.length === 0) return 'No endpoints muted.';
  return muted
    .map(e => `${e.url} muted until ${new Date(e.until).toISOString()}${e.reason ? ` (${e.reason})` : ''}`)
    .join('\n');
}
