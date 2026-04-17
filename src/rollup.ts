import { HistoryEntry, averageLatency, errorRate } from "./history";

export interface RollupWindow {
  label: string;
  durationMs: number;
}

export interface RollupResult {
  endpoint: string;
  window: string;
  avgLatency: number;
  errorRate: number;
  sampleCount: number;
  from: number;
  to: number;
}

export const DEFAULT_WINDOWS: RollupWindow[] = [
  { label: "1m", durationMs: 60_000 },
  { label: "5m", durationMs: 300_000 },
  { label: "15m", durationMs: 900_000 },
];

export function rollupEntries(
  endpoint: string,
  entries: HistoryEntry[],
  window: RollupWindow,
  now = Date.now()
): RollupResult {
  const from = now - window.durationMs;
  const slice = entries.filter((e) => e.timestamp >= from && e.timestamp <= now);
  return {
    endpoint,
    window: window.label,
    avgLatency: averageLatency(slice),
    errorRate: errorRate(slice),
    sampleCount: slice.length,
    from,
    to: now,
  };
}

export function rollupAll(
  endpoint: string,
  entries: HistoryEntry[],
  windows: RollupWindow[] = DEFAULT_WINDOWS,
  now = Date.now()
): RollupResult[] {
  return windows.map((w) => rollupEntries(endpoint, entries, w, now));
}

export function formatRollup(r: RollupResult): string {
  return (
    `[${r.endpoint}] window=${r.window} samples=${r.sampleCount} ` +
    `avgLatency=${r.avgLatency.toFixed(1)}ms errorRate=${(r.errorRate * 100).toFixed(1)}%`
  );
}
