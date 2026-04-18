import { HistoryEntry, averageLatency } from './history';

export interface AnomalyResult {
  endpoint: string;
  latency: number;
  mean: number;
  stddev: number;
  zScore: number;
  isAnomaly: boolean;
}

export function computeStddev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function detectAnomaly(
  entry: HistoryEntry,
  history: HistoryEntry[],
  threshold = 2.5
): AnomalyResult {
  const latencies = history.map((e) => e.latency);
  const mean = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : entry.latency;
  const stddev = computeStddev(latencies);
  const zScore = stddev === 0 ? 0 : Math.abs(entry.latency - mean) / stddev;
  return {
    endpoint: entry.url,
    latency: entry.latency,
    mean,
    stddev,
    zScore,
    isAnomaly: zScore > threshold,
  };
}

export function detectAnomalies(
  entries: HistoryEntry[],
  history: HistoryEntry[],
  threshold = 2.5
): AnomalyResult[] {
  return entries.map((e) => detectAnomaly(e, history.filter((h) => h.url === e.url), threshold));
}
