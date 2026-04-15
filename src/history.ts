import { ReportEntry } from './reporter';

export interface HistoryStore {
  entries: ReportEntry[];
  maxSize: number;
}

export function createStore(maxSize = 500): HistoryStore {
  return { entries: [], maxSize };
}

export function addEntry(store: HistoryStore, entry: ReportEntry): void {
  store.entries.push(entry);
  if (store.entries.length > store.maxSize) {
    store.entries.shift();
  }
}

export function getEntries(
  store: HistoryStore,
  endpoint?: string
): ReportEntry[] {
  if (!endpoint) return [...store.entries];
  return store.entries.filter((e) => e.endpoint === endpoint);
}

export function averageLatency(
  store: HistoryStore,
  endpoint?: string
): number | null {
  const entries = getEntries(store, endpoint);
  if (entries.length === 0) return null;
  const total = entries.reduce((sum, e) => sum + e.latencyMs, 0);
  return Math.round(total / entries.length);
}

export function errorRate(
  store: HistoryStore,
  endpoint?: string
): number {
  const entries = getEntries(store, endpoint);
  if (entries.length === 0) return 0;
  const failures = entries.filter((e) => !e.ok).length;
  return failures / entries.length;
}

export function clearHistory(store: HistoryStore): void {
  store.entries = [];
}
