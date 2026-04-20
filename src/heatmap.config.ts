// heatmap.config.ts — configuration parsing for heatmap feature

export interface HeatmapConfig {
  enabled: boolean;
  trackErrors: boolean;
  minSamples: number;
}

const DEFAULTS: HeatmapConfig = {
  enabled: true,
  trackErrors: true,
  minSamples: 3,
};

export function parseHeatmapConfig(raw: Record<string, unknown>): HeatmapConfig {
  const cfg: HeatmapConfig = { ...DEFAULTS };

  if (typeof raw.enabled === "boolean") cfg.enabled = raw.enabled;
  if (typeof raw.trackErrors === "boolean") cfg.trackErrors = raw.trackErrors;
  if (typeof raw.minSamples === "number" && raw.minSamples > 0) {
    cfg.minSamples = Math.floor(raw.minSamples);
  }

  return cfg;
}

export function applyHeatmapDefaults(
  partial: Partial<HeatmapConfig>
): HeatmapConfig {
  return {
    enabled: partial.enabled ?? DEFAULTS.enabled,
    trackErrors: partial.trackErrors ?? DEFAULTS.trackErrors,
    minSamples: partial.minSamples ?? DEFAULTS.minSamples,
  };
}

export function heatmapConfigSummary(cfg: HeatmapConfig): string {
  if (!cfg.enabled) return "heatmap: disabled";
  return (
    `heatmap: enabled, trackErrors=${cfg.trackErrors}, ` +
    `minSamples=${cfg.minSamples}`
  );
}
