import { getEntries, HistoryStore } from './history';
import { averageLatency, errorRate } from './history';
import { formatTimestamp, formatLatency } from './formatter';

export interface DigestEntry {
  endpoint: string;
  period: { from: number; to: number };
  totalRequests: number;
  avgLatency: number;
  errorRate: number;
  p95Latency: number;
  minLatency: number;
  maxLatency: number;
}

export function computeP95(latencies: number[]): number {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, idx)];
}

export function buildDigest(endpoint: string, store: HistoryStore): DigestEntry {
  const entries = getEntries(store);
  const latencies = entries.map(e => e.latency);
  const now = Date.now();
  const from = entries.length > 0 ? entries[0].timestamp : now;
  const to = entries.length > 0 ? entries[entries.length - 1].timestamp : now;

  return {
    endpoint,
    period: { from, to },
    totalRequests: entries.length,
    avgLatency: averageLatency(store),
    errorRate: errorRate(store),
    p95Latency: computeP95(latencies),
    minLatency: latencies.length > 0 ? Math.min(...latencies) : 0,
    maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
  };
}

export function formatDigest(digest: DigestEntry): string {
  const lines = [
    `Digest for: ${digest.endpoint}`,
    `Period: ${formatTimestamp(digest.period.from)} → ${formatTimestamp(digest.period.to)}`,
    `Requests : ${digest.totalRequests}`,
    `Avg Latency: ${formatLatency(digest.avgLatency)}`,
    `P95 Latency: ${formatLatency(digest.p95Latency)}`,
    `Min/Max: ${formatLatency(digest.minLatency)} / ${formatLatency(digest.maxLatency)}`,
    `Error Rate: ${(digest.errorRate * 100).toFixed(1)}%`,
  ];
  return lines.join('\n');
}

export function buildAllDigests(
  stores: Map<string, HistoryStore>
): DigestEntry[] {
  return Array.from(stores.entries()).map(([endpoint, store]) =>
    buildDigest(endpoint, store)
  );
}
