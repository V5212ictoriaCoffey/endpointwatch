import { HistoryStore, getEntries, averageLatency, errorRate } from "./history";
import { formatLatency } from "./formatter";

export type StatusLevel = "operational" | "degraded" | "outage" | "unknown";

export interface EndpointStatus {
  url: string;
  level: StatusLevel;
  avgLatencyMs: number;
  errorRatePct: number;
  lastChecked: number | null;
}

export interface StatusPage {
  generatedAt: number;
  endpoints: EndpointStatus[];
  overallLevel: StatusLevel;
}

export interface StatusPageOptions {
  degradedLatencyMs?: number;
  outageErrorRatePct?: number;
  degradedErrorRatePct?: number;
}

const defaults: Required<StatusPageOptions> = {
  degradedLatencyMs: 1000,
  outageErrorRatePct: 50,
  degradedErrorRatePct: 10,
};

export function resolveLevel(
  avgLatency: number,
  errRate: number,
  opts: Required<StatusPageOptions>
): StatusLevel {
  if (errRate >= opts.outageErrorRatePct) return "outage";
  if (errRate >= opts.degradedErrorRatePct) return "degraded";
  if (avgLatency >= opts.degradedLatencyMs) return "degraded";
  return "operational";
}

export function overallLevel(statuses: EndpointStatus[]): StatusLevel {
  if (statuses.some((s) => s.level === "outage")) return "outage";
  if (statuses.some((s) => s.level === "degraded")) return "degraded";
  if (statuses.every((s) => s.level === "operational")) return "operational";
  return "unknown";
}

export function buildStatusPage(
  stores: Map<string, HistoryStore>,
  opts: StatusPageOptions = {}
): StatusPage {
  const resolved = { ...defaults, ...opts };
  const endpoints: EndpointStatus[] = [];

  for (const [url, store] of stores.entries()) {
    const entries = getEntries(store);
    const last = entries.length > 0 ? entries[entries.length - 1].timestamp : null;
    const avg = averageLatency(store);
    const err = errorRate(store) * 100;
    const level = entries.length === 0 ? "unknown" : resolveLevel(avg, err, resolved);
    endpoints.push({ url, level, avgLatencyMs: avg, errorRatePct: err, lastChecked: last });
  }

  return { generatedAt: Date.now(), endpoints, overallLevel: overallLevel(endpoints) };
}

export function formatStatusPage(page: StatusPage): string {
  const lines: string[] = [
    `Status Page — ${new Date(page.generatedAt).toISOString()}`,
    `Overall: ${page.overallLevel.toUpperCase()}`,
    "",
  ];
  for (const ep of page.endpoints) {
    const latency = formatLatency(ep.avgLatencyMs);
    const err = ep.errorRatePct.toFixed(1);
    const last = ep.lastChecked ? new Date(ep.lastChecked).toISOString() : "never";
    lines.push(`  [${ep.level.toUpperCase().padEnd(11)}] ${ep.url}`);
    lines.push(`    avg latency: ${latency}  error rate: ${err}%  last checked: ${last}`);
  }
  return lines.join("\n");
}
