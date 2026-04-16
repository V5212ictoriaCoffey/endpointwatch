export interface BaselineConfig {
  enabled: boolean;
  latencyThresholdPct: number;
  minSamples: number;
}

const defaults: BaselineConfig = {
  enabled: true,
  latencyThresholdPct: 0.5,
  minSamples: 5,
};

export function parseBaselineConfig(raw: Record<string, unknown>): BaselineConfig {
  return applyBaselineDefaults(raw);
}

export function applyBaselineDefaults(raw: Partial<BaselineConfig>): BaselineConfig {
  return {
    enabled: raw.enabled ?? defaults.enabled,
    latencyThresholdPct:
      typeof raw.latencyThresholdPct === 'number'
        ? raw.latencyThresholdPct
        : defaults.latencyThresholdPct,
    minSamples:
      typeof raw.minSamples === 'number' ? raw.minSamples : defaults.minSamples,
  };
}

export function baselineConfigSummary(cfg: BaselineConfig): string {
  if (!cfg.enabled) return '[baseline] disabled';
  return `[baseline] enabled threshold=${(cfg.latencyThresholdPct * 100).toFixed(0)}% minSamples=${cfg.minSamples}`;
}
