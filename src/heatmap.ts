// heatmap.ts — latency heatmap bucketing by hour-of-day and day-of-week

export interface HeatmapCell {
  hour: number;       // 0–23
  day: number;        // 0 (Sun) – 6 (Sat)
  count: number;
  totalLatency: number;
  avgLatency: number;
  errorCount: number;
}

export interface HeatmapStore {
  cells: Map<string, HeatmapCell>;
}

export function createHeatmapStore(): HeatmapStore {
  return { cells: new Map() };
}

function cellKey(day: number, hour: number): string {
  return `${day}:${hour}`;
}

export function recordHeatmap(
  store: HeatmapStore,
  timestamp: number,
  latencyMs: number,
  isError: boolean
): void {
  const date = new Date(timestamp);
  const hour = date.getHours();
  const day = date.getDay();
  const key = cellKey(day, hour);

  const existing = store.cells.get(key) ?? {
    hour,
    day,
    count: 0,
    totalLatency: 0,
    avgLatency: 0,
    errorCount: 0,
  };

  existing.count += 1;
  existing.totalLatency += latencyMs;
  existing.avgLatency = existing.totalLatency / existing.count;
  if (isError) existing.errorCount += 1;

  store.cells.set(key, existing);
}

export function getHeatmapCell(
  store: HeatmapStore,
  day: number,
  hour: number
): HeatmapCell | undefined {
  return store.cells.get(cellKey(day, hour));
}

export function getAllCells(store: HeatmapStore): HeatmapCell[] {
  return Array.from(store.cells.values());
}

export function peakCell(store: HeatmapStore): HeatmapCell | undefined {
  let peak: HeatmapCell | undefined;
  for (const cell of store.cells.values()) {
    if (!peak || cell.avgLatency > peak.avgLatency) peak = cell;
  }
  return peak;
}
