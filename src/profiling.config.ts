/**
 * profiling.config.ts — Configuration parsing and defaults for profiling.
 */

export interface ProfilingConfig {
  enabled: boolean;
  /** Minimum call count before profiling data is considered meaningful */
  minSamples: number;
  /** Latency threshold (ms) above which a call is flagged as slow */
  slowThresholdMs: number;
}

const DEFAULT_PROFILING_CONFIG: ProfilingConfig = {
  enabled: true,
  minSamples: 5,
  slowThresholdMs: 1000,
};

export function parseProfilingConfig(
  raw: Record<string, unknown>
): Partial<ProfilingConfig> {
  const config: Partial<ProfilingConfig> = {};

  if (typeof raw.enabled === "boolean") config.enabled = raw.enabled;
  if (typeof raw.minSamples === "number" && raw.minSamples > 0)
    config.minSamples = raw.minSamples;
  if (typeof raw.slowThresholdMs === "number" && raw.slowThresholdMs > 0)
    config.slowThresholdMs = raw.slowThresholdMs;

  return config;
}

export function applyProfilingDefaults(
  partial: Partial<ProfilingConfig>
): ProfilingConfig {
  return { ...DEFAULT_PROFILING_CONFIG, ...partial };
}

export function profilingConfigSummary(config: ProfilingConfig): string {
  if (!config.enabled) return "profiling: disabled";
  return (
    `profiling: enabled | minSamples=${config.minSamples} | ` +
    `slowThreshold=${config.slowThresholdMs}ms`
  );
}
