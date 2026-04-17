import { getEntries, HistoryEntry } from './history';

export interface ReplayOptions {
  from?: number;
  to?: number;
  limit?: number;
  endpointUrl?: string;
}

export interface ReplayResult {
  entries: HistoryEntry[];
  count: number;
  from: number | null;
  to: number | null;
}

export function replayEntries(
  store: ReturnType<typeof import('./history').createStore>,
  options: ReplayOptions = {}
): ReplayResult {
  let entries = getEntries(store);

  if (options.endpointUrl) {
    entries = entries.filter(e => e.url === options.endpointUrl);
  }

  if (options.from !== undefined) {
    entries = entries.filter(e => e.timestamp >= options.from!);
  }

  if (options.to !== undefined) {
    entries = entries.filter(e => e.timestamp <= options.to!);
  }

  entries = entries.sort((a, b) => a.timestamp - b.timestamp);

  if (options.limit !== undefined && options.limit > 0) {
    entries = entries.slice(0, options.limit);
  }

  return {
    entries,
    count: entries.length,
    from: entries.length > 0 ? entries[0].timestamp : null,
    to: entries.length > 0 ? entries[entries.length - 1].timestamp : null,
  };
}

export function formatReplay(result: ReplayResult): string {
  if (result.count === 0) return 'No entries found for replay.';
  const lines = result.entries.map(e =>
    `[${new Date(e.timestamp).toISOString()}] ${e.url} — ${e.status} ${e.latency}ms`
  );
  return lines.join('\n');
}
