import { describe, it, expect, beforeEach } from 'vitest';
import { aggregateMetrics, snapshotFromResult, MetricSnapshot } from './metrics';
import { createMetricsStore } from './metrics.store';
import { parseMetricsConfig, metricsSummary } from './metrics.config';

function makeSnapshot(overrides: Partial<MetricSnapshot> = {}): MetricSnapshot {
  return {
    endpoint: 'https://api.example.com/health',
    timestamp: Date.now(),
    latencyMs: 120,
    statusCode: 200,
    success: true,
    ...overrides,
  };
}

describe('aggregateMetrics', () => {
  it('returns null for empty array', () => {
    expect(aggregateMetrics([])).toBeNull();
  });

  it('computes correct averages', () => {
    const snaps = [100, 200, 300].map((l) => makeSnapshot({ latencyMs: l }));
    const agg = aggregateMetrics(snaps)!;
    expect(agg.avgLatencyMs).toBe(200);
    expect(agg.minLatencyMs).toBe(100);
    expect(agg.maxLatencyMs).toBe(300);
    expect(agg.count).toBe(3);
  });

  it('calculates uptime percentage', () => {
    const snaps = [
      makeSnapshot({ success: true }),
      makeSnapshot({ success: false }),
      makeSnapshot({ success: true }),
      makeSnapshot({ success: true }),
    ];
    const agg = aggregateMetrics(snaps)!;
    expect(agg.uptimePct).toBe(75);
    expect(agg.failureCount).toBe(1);
  });
});

describe('snapshotFromResult', () => {
  it('maps result fields correctly', () => {
    const snap = snapshotFromResult({ url: 'https://x.com', latencyMs: 50, statusCode: 200, ok: true });
    expect(snap.endpoint).toBe('https://x.com');
    expect(snap.success).toBe(true);
    expect(snap.latencyMs).toBe(50);
  });
});

describe('MetricsStore', () => {
  const store = createMetricsStore(5);
  beforeEach(() => store.clear());

  it('stores and retrieves snapshots', () => {
    store.push(makeSnapshot());
    expect(store.getSnapshots('https://api.example.com/health')).toHaveLength(1);
  });

  it('respects retention limit', () => {
    for (let i = 0; i < 8; i++) store.push(makeSnapshot());
    expect(store.getSnapshots('https://api.example.com/health')).toHaveLength(5);
  });

  it('aggregateAll returns entries for all endpoints', () => {
    store.push(makeSnapshot({ endpoint: 'https://a.com' }));
    store.push(makeSnapshot({ endpoint: 'https://b.com' }));
    expect(store.aggregateAll()).toHaveLength(2);
  });
});

describe('parseMetricsConfig', () => {
  it('applies defaults', () => {
    const cfg = parseMetricsConfig({});
    expect(cfg.enabled).toBe(true);
    expect(cfg.retentionLimit).toBe(500);
  });

  it('parses thresholds', () => {
    const cfg = parseMetricsConfig({ p95Threshold: 300, avgLatencyThreshold: 150 });
    expect(cfg.p95Threshold).toBe(300);
    expect(cfg.avgLatencyThreshold).toBe(150);
  });

  it('metricsSummary includes thresholds', () => {
    const summary = metricsSummary({ enabled: true, retentionLimit: 100, p95Threshold: 400 });
    expect(summary).toContain('p95<400ms');
  });
});
