import { HistoryStore, averageLatency, errorRate, getEntries } from './history';

export interface EndpointSummary {
  endpoint: string;
  totalChecks: number;
  avgLatencyMs: number | null;
  errorRatePct: number;
  lastStatus: number | null;
  lastOk: boolean | null;
}

export function summarizeEndpoint(
  store: HistoryStore,
  endpoint: string
): EndpointSummary {
  const entries = getEntries(store, endpoint);
  const last = entries.length > 0 ? entries[entries.length - 1] : null;

  return {
    endpoint,
    totalChecks: entries.length,
    avgLatencyMs: averageLatency(store, endpoint),
    errorRatePct: Math.round(errorRate(store, endpoint) * 100),
    lastStatus: last ? last.statusCode : null,
    lastOk: last ? last.ok : null,
  };
}

export function summarizeAll(store: HistoryStore): EndpointSummary[] {
  const endpoints = [...new Set(store.entries.map((e) => e.endpoint))];
  return endpoints.map((ep) => summarizeEndpoint(store, ep));
}

export function printSummary(summaries: EndpointSummary[]): void {
  if (summaries.length === 0) {
    console.log('No data collected yet.');
    return;
  }
  console.log('\n=== EndpointWatch Summary ===');
  for (const s of summaries) {
    const latency = s.avgLatencyMs !== null ? `${s.avgLatencyMs}ms` : 'N/A';
    const status = s.lastOk ? '\u2705' : '\u274C';
    console.log(
      `${status} ${s.endpoint} | checks: ${s.totalChecks} | avg latency: ${latency} | error rate: ${s.errorRatePct}%`
    );
  }
  console.log('');
}
