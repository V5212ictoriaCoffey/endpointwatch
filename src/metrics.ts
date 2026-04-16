export interface MetricSnapshot {
  endpoint: string;
  timestamp: number;
  latencyMs: number;
  statusCode: number;
  success: boolean;
}

export interface AggregatedMetrics {
  endpoint: string;
  count: number;
  successCount: number;
  failureCount: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  p95LatencyMs: number;
  uptimePct: number;
}

export function aggregateMetrics(snapshots: MetricSnapshot[]): AggregatedMetrics | null {
  if (snapshots.length === 0) return null;
  const endpoint = snapshots[0].endpoint;
  const latencies = snapshots.map((s) => s.latencyMs).sort((a, b) => a - b);
  const successCount = snapshots.filter((s) => s.success).length;
  const count = snapshots.length;
  const sum = latencies.reduce((a, b) => a + b, 0);
  const p95Index = Math.floor(latencies.length * 0.95);
  return {
    endpoint,
    count,
    successCount,
    failureCount: count - successCount,
    avgLatencyMs: Math.round(sum / count),
    minLatencyMs: latencies[0],
    maxLatencyMs: latencies[latencies.length - 1],
    p95LatencyMs: latencies[Math.min(p95Index, latencies.length - 1)],
    uptimePct: parseFloat(((successCount / count) * 100).toFixed(2)),
  };
}

export function snapshotFromResult(result: {
  url: string;
  latencyMs: number;
  statusCode: number;
  ok: boolean;
}): MetricSnapshot {
  return {
    endpoint: result.url,
    timestamp: Date.now(),
    latencyMs: result.latencyMs,
    statusCode: result.statusCode,
    success: result.ok,
  };
}
