import { ThrottleOptions, parseThrottleOptions } from './throttle';

export interface ThrottleConfig {
  enabled: boolean;
  minIntervalMs: number;
  maxConcurrent: number;
}

const DEFAULTS: ThrottleConfig = {
  enabled: false,
  minIntervalMs: 0,
  maxConcurrent: 10,
};

export function resolveThrottleConfig(raw?: Record<string, unknown>): ThrottleConfig {
  if (!raw) return { ...DEFAULTS };
  const opts = parseThrottleOptions(raw);
  return {
    enabled: raw.enabled === true,
    minIntervalMs: opts.minIntervalMs,
    maxConcurrent: opts.maxConcurrent,
  };
}

export function applyThrottleDefaults(partial: Partial<ThrottleConfig>): ThrottleConfig {
  return { ...DEFAULTS, ...partial };
}

export function throttleSummary(cfg: ThrottleConfig): string {
  if (!cfg.enabled) return 'throttle: disabled';
  return `throttle: maxConcurrent=${cfg.maxConcurrent}, minIntervalMs=${cfg.minIntervalMs}ms`;
}

export function toThrottleOptions(cfg: ThrottleConfig): ThrottleOptions {
  return {
    minIntervalMs: cfg.minIntervalMs,
    maxConcurrent: cfg.maxConcurrent,
  };
}
