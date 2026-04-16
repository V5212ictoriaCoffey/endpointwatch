import { HistoryStore, getEntries, averageLatency, errorRate } from './history';

export interface BaselineStats {
  url: string;
  avgLatency: number;
  errorRate: number;
  sampleSize: number;
  capturedAt: number;
}

export interface BaselineStore {
  baselines: Map<string, BaselineStats>;
}

export function createBaselineStore(): BaselineStore {
  return { baselines: new Map() };
}

export function captureBaseline(
  store: BaselineStore,
  history: HistoryStore,
  url: string
): BaselineStats {
  const entries = getEntries(history, url);
  const stats: BaselineStats = {
    url,
    avgLatency: averageLatency(history, url),
    errorRate: errorRate(history, url),
    sampleSize: entries.length,
    capturedAt: Date.now(),
  };
  store.baselines.set(url, stats);
  return stats;
}

export function getBaseline(store: BaselineStore, url: string): BaselineStats | undefined {
  return store.baselines.get(url);
}

export function deviatesFromBaseline(
  store: BaselineStore,
  url: string,
  currentLatency: number,
  latencyThresholdPct = 0.5
): boolean {
  const baseline = store.baselines.get(url);
  if (!baseline || baseline.sampleSize === 0) return false;
  const delta = Math.abs(currentLatency - baseline.avgLatency);
  return delta / (baseline.avgLatency || 1) > latencyThresholdPct;
}

export function clearBaseline(store: BaselineStore, url: string): void {
  store.baselines.delete(url);
}

export function baselineSummary(stats: BaselineStats): string {
  return `[baseline] ${stats.url} avg=${stats.avgLatency.toFixed(1)}ms errRate=${(stats.errorRate * 100).toFixed(1)}% n=${stats.sampleSize}`;
}
