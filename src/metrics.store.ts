import { MetricSnapshot, AggregatedMetrics, aggregateMetrics } from './metrics';

export interface MetricsStore {
  push(snapshot: MetricSnapshot): void;
  getSnapshots(endpoint: string): MetricSnapshot[];
  aggregate(endpoint: string): AggregatedMetrics | null;
  aggregateAll(): AggregatedMetrics[];
  clear(endpoint?: string): void;
}

export function createMetricsStore(retentionLimit = 500): MetricsStore {
  const store = new Map<string, MetricSnapshot[]>();

  function push(snapshot: MetricSnapshot): void {
    const list = store.get(snapshot.endpoint) ?? [];
    list.push(snapshot);
    if (list.length > retentionLimit) list.splice(0, list.length - retentionLimit);
    store.set(snapshot.endpoint, list);
  }

  function getSnapshots(endpoint: string): MetricSnapshot[] {
    return store.get(endpoint) ?? [];
  }

  function aggregate(endpoint: string): AggregatedMetrics | null {
    return aggregateMetrics(getSnapshots(endpoint));
  }

  function aggregateAll(): AggregatedMetrics[] {
    const results: AggregatedMetrics[] = [];
    for (const endpoint of store.keys()) {
      const agg = aggregate(endpoint);
      if (agg) results.push(agg);
    }
    return results;
  }

  function clear(endpoint?: string): void {
    if (endpoint) store.delete(endpoint);
    else store.clear();
  }

  return { push, getSnapshots, aggregate, aggregateAll, clear };
}
