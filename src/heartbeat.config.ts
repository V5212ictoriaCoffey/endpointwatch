export interface HeartbeatConfig {
  windowMs: number;
  minUptimeRatio: number;
  alertOnMissed: boolean;
  missedThreshold: number;
}

const defaults: HeartbeatConfig = {
  windowMs: 60_000,
  minUptimeRatio: 0.95,
  alertOnMissed: true,
  missedThreshold: 3,
};

export function parseHeartbeatConfig(raw: Record<string, unknown>): Partial<HeartbeatConfig> {
  const cfg: Partial<HeartbeatConfig> = {};
  if (typeof raw.windowMs === 'number') cfg.windowMs = raw.windowMs;
  if (typeof raw.minUptimeRatio === 'number') cfg.minUptimeRatio = raw.minUptimeRatio;
  if (typeof raw.alertOnMissed === 'boolean') cfg.alertOnMissed = raw.alertOnMissed;
  if (typeof raw.missedThreshold === 'number') cfg.missedThreshold = raw.missedThreshold;
  return cfg;
}

export function applyHeartbeatDefaults(cfg: Partial<HeartbeatConfig>): HeartbeatConfig {
  return { ...defaults, ...cfg };
}

export function heartbeatConfigSummary(cfg: HeartbeatConfig): string {
  return [
    `window=${cfg.windowMs}ms`,
    `minUptime=${(cfg.minUptimeRatio * 100).toFixed(1)}%`,
    `alertOnMissed=${cfg.alertOnMissed}`,
    `missedThreshold=${cfg.missedThreshold}`,
  ].join(' ');
}
