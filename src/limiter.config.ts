/**
 * limiter.config.ts — Config parsing and defaults for the concurrency limiter
 */

import type { LimiterOptions } from "./limiter";

export interface LimiterConfig {
  maxConcurrent?: number;
}

const DEFAULT_MAX_CONCURRENT = 10;

export function parseLimiterConfig(raw: Record<string, unknown>): LimiterConfig {
  const config: LimiterConfig = {};

  if (raw.maxConcurrent !== undefined) {
    const val = Number(raw.maxConcurrent);
    if (!Number.isInteger(val) || val < 1) {
      throw new Error(`limiter.maxConcurrent must be a positive integer, got: ${raw.maxConcurrent}`);
    }
    config.maxConcurrent = val;
  }

  return config;
}

export function applyLimiterDefaults(config: LimiterConfig): Required<LimiterConfig> {
  return {
    maxConcurrent: config.maxConcurrent ?? DEFAULT_MAX_CONCURRENT,
  };
}

export function toLimiterOptions(config: LimiterConfig): LimiterOptions {
  const resolved = applyLimiterDefaults(config);
  return { maxConcurrent: resolved.maxConcurrent };
}

export function limiterConfigSummary(config: LimiterConfig): string {
  const resolved = applyLimiterDefaults(config);
  return `maxConcurrent=${resolved.maxConcurrent}`;
}
