export interface SlaTarget {
  url: string;
  uptimePercent: number; // e.g. 99.9
  maxLatencyMs: number;
}

export interface SlaResult {
  url: string;
  target: SlaTarget;
  actualUptimePercent: number;
  actualAvgLatencyMs: number;
  uptimeMet: boolean;
  latencyMet: boolean;
  met: boolean;
}

export function checkSla(
  target: SlaTarget,
  totalChecks: number,
  successChecks: number,
  avgLatencyMs: number
): SlaResult {
  const actualUptimePercent =
    totalChecks === 0 ? 100 : (successChecks / totalChecks) * 100;
  const uptimeMet = actualUptimePercent >= target.uptimePercent;
  const latencyMet = avgLatencyMs <= target.maxLatencyMs;
  return {
    url: target.url,
    target,
    actualUptimePercent,
    actualAvgLatencyMs: avgLatencyMs,
    uptimeMet,
    latencyMet,
    met: uptimeMet && latencyMet,
  };
}

export function checkAllSlas(
  targets: SlaTarget[],
  stats: Record<string, { total: number; success: number; avgLatency: number }>
): SlaResult[] {
  return targets.map((t) => {
    const s = stats[t.url] ?? { total: 0, success: 0, avgLatency: 0 };
    return checkSla(t, s.total, s.success, s.avgLatency);
  });
}

export function formatSlaResult(r: SlaResult): string {
  const status = r.met ? "✓ MET" : "✗ BREACHED";
  return (
    `[SLA ${status}] ${r.url} | ` +
    `uptime: ${r.actualUptimePercent.toFixed(2)}% (target: ${r.target.uptimePercent}%) | ` +
    `latency: ${r.actualAvgLatencyMs.toFixed(0)}ms (target: ${r.target.maxLatencyMs}ms)`
  );
}
