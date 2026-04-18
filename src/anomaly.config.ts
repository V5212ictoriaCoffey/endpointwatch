export interface AnomalyConfig {
  enabled: boolean;
  zScoreThreshold: number;
  minSamples: number;
}

const defaults: AnomalyConfig = {
  enabled: true,
  zScoreThreshold: 2.5,
  minSamples: 5,
};

export function parseAnomalyConfig(raw: Record<string, unknown>): Partial<AnomalyConfig> {
  const config: Partial<AnomalyConfig> = {};
  if (typeof raw.anomalyDetection === 'object' && raw.anomalyDetection !== null) {
    const a = raw.anomalyDetection as Record<string, unknown>;
    if (typeof a.enabled === 'boolean') config.enabled = a.enabled;
    if (typeof a.zScoreThreshold === 'number') config.zScoreThreshold = a.zScoreThreshold;
    if (typeof a.minSamples === 'number') config.minSamples = a.minSamples;
  }
  return config;
}

export function applyAnomalyDefaults(partial: Partial<AnomalyConfig>): AnomalyConfig {
  return { ...defaults, ...partial };
}

export function anomalyConfigSummary(cfg: AnomalyConfig): string {
  return `anomaly detection: ${cfg.enabled ? 'on' : 'off'}, z-threshold=${cfg.zScoreThreshold}, minSamples=${cfg.minSamples}`;
}
