/**
 * Debounce: suppress repeated alerts/events for the same endpoint
 * within a configurable quiet window.
 */

export interface DebounceOptions {
  windowMs: number;
}

export interface DebounceEntry {
  url: string;
  firstSeenAt: number;
  lastSeenAt: number;
  count: number;
  suppressed: boolean;
}

export interface DebounceStore {
  entries: Map<string, DebounceEntry>;
  options: DebounceOptions;
}

export function createDebounceStore(options: DebounceOptions): DebounceStore {
  return { entries: new Map(), options };
}

export function recordEvent(
  store: DebounceStore,
  url: string,
  now = Date.now()
): DebounceEntry {
  const existing = store.entries.get(url);
  if (existing) {
    existing.lastSeenAt = now;
    existing.count += 1;
    existing.suppressed = now - existing.firstSeenAt < store.options.windowMs;
    return existing;
  }
  const entry: DebounceEntry = {
    url,
    firstSeenAt: now,
    lastSeenAt: now,
    count: 1,
    suppressed: false,
  };
  store.entries.set(url, entry);
  return entry;
}

export function isSuppressed(store: DebounceStore, url: string, now = Date.now()): boolean {
  const entry = store.entries.get(url);
  if (!entry) return false;
  return now - entry.firstSeenAt < store.options.windowMs;
}

export function clearDebounce(store: DebounceStore, url: string): void {
  store.entries.delete(url);
}

export function clearAllDebounce(store: DebounceStore): void {
  store.entries.clear();
}

export function pruneExpiredDebounce(store: DebounceStore, now = Date.now()): number {
  let pruned = 0;
  for (const [url, entry] of store.entries) {
    if (now - entry.firstSeenAt >= store.options.windowMs) {
      store.entries.delete(url);
      pruned++;
    }
  }
  return pruned;
}

export function debounceSummary(store: DebounceStore): string {
  const total = store.entries.size;
  const suppressed = [...store.entries.values()].filter((e) => e.suppressed).length;
  return `debounce: ${total} tracked, ${suppressed} suppressed, windowMs=${store.options.windowMs}`;
}
