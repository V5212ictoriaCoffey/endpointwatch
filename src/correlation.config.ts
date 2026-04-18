/**
 * Configuration parsing and defaults for correlation analysis.
 */

export interface CorrelationConfig {
  windowMs: number;      // time window in ms to group entries
  minGroupSize: number;  // minimum entries in a window to consider
  maxResults: number;    // max correlated pairs to return
  enabled: boolean;
}

const DEFAULT_CORRELATION_CONFIG: CorrelationConfig = {
  windowMs: 60_000,
  minGroupSize: 2,
  maxResults: 10,
  enabled: true,
};

export function parseCorrelationConfig(raw: Record<string, unknown>): CorrelationConfig {
  const cfg = { ...DEFAULT_CORRELATION_CONFIG };

  if (typeof raw.windowMs === "number" && raw.windowMs > 0) {
    cfg.windowMs = raw.windowMs;
  }

  if (typeof raw.minGroupSize === "number" && raw.minGroupSize >= 1) {
    cfg.minGroupSize = raw.minGroupSize;
  }

  if (typeof raw.maxResults === "number" && raw.maxResults >= 1) {
    cfg.maxResults = raw.maxResults;
  }

  if (typeof raw.enabled === "boolean") {
    cfg.enabled = raw.enabled;
  }

  return cfg;
}

export function applyCorrelationDefaults(
  partial: Partial<CorrelationConfig>
): CorrelationConfig {
  return { ...DEFAULT_CORRELATION_CONFIG, ...partial };
}

export function correlationConfigSummary(cfg: CorrelationConfig): string {
  if (!cfg.enabled) return "correlation: disabled";
  return (
    `correlation: windowMs=${cfg.windowMs}, ` +
    `minGroupSize=${cfg.minGroupSize}, maxResults=${cfg.maxResults}`
  );
}
