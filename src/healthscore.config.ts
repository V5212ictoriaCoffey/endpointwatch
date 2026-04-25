/**
 * healthscore.config.ts
 * Parses and applies defaults for health score configuration.
 */

export interface HealthScoreConfig {
  latencyBudget: number;   // ms
  slaTarget: number;       // 0..1
  weights?: {
    availability?: number;
    latency?: number;
    sla?: number;
    stability?: number;
  };
}

const DEFAULTS: HealthScoreConfig = {
  latencyBudget: 500,
  slaTarget: 0.99,
};

export function parseHealthScoreConfig(
  raw: Record<string, unknown>
): Partial<HealthScoreConfig> {
  const out: Partial<HealthScoreConfig> = {};

  if (typeof raw['latencyBudget'] === 'number') {
    out.latencyBudget = raw['latencyBudget'];
  }
  if (typeof raw['slaTarget'] === 'number') {
    const t = raw['slaTarget'] as number;
    if (t > 0 && t <= 1) out.slaTarget = t;
  }
  if (raw['weights'] && typeof raw['weights'] === 'object') {
    const w = raw['weights'] as Record<string, unknown>;
    out.weights = {};
    for (const key of ['availability', 'latency', 'sla', 'stability'] as const) {
      if (typeof w[key] === 'number') out.weights[key] = w[key] as number;
    }
  }

  return out;
}

export function applyHealthScoreDefaults(
  partial: Partial<HealthScoreConfig>
): HealthScoreConfig {
  return {
    ...DEFAULTS,
    ...partial,
    weights: partial.weights ?? {},
  };
}

export function healthScoreConfigSummary(cfg: HealthScoreConfig): string {
  return (
    `healthscore: latencyBudget=${cfg.latencyBudget}ms ` +
    `slaTarget=${(cfg.slaTarget * 100).toFixed(2)}%`
  );
}
