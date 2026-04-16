export interface MetricsConfig {
  enabled: boolean;
  retentionLimit: number;
  p95Threshold?: number;
  avgLatencyThreshold?: number;
}

const defaults: MetricsConfig = {
  enabled: true,
  retentionLimit: 500,
};

export function parseMetricsConfig(raw: Record<string, unknown>): MetricsConfig {
  const cfg: MetricsConfig = { ...defaults };
  if (typeof raw.metricsEnabled === 'boolean') cfg.enabled = raw.metricsEnabled;
  if (typeof raw.metricsRetentionLimit === 'number') cfg.retentionLimit = raw.metricsRetentionLimit;
  if (typeof raw.p95Threshold === 'number') cfg.p95Threshold = raw.p95Threshold;
  if (typeof raw.avgLatencyThreshold === 'number') cfg.avgLatencyThreshold = raw.avgLatencyThreshold;
  return cfg;
}

export function applyMetricsDefaults(cfg: Partial<MetricsConfig>): MetricsConfig {
  return { ...defaults, ...cfg };
}

export function metricsSummary(cfg: MetricsConfig): string {
  const parts = [`retention=${cfg.retentionLimit}`];
  if (cfg.p95Threshold !== undefined) parts.push(`p95<${cfg.p95Threshold}ms`);
  if (cfg.avgLatencyThreshold !== undefined) parts.push(`avg<${cfg.avgLatencyThreshold}ms`);
  return `metrics(${parts.join(', ')})`;
}
