/**
 * Configuration parsing and defaults for rate limiting,
 * integrated with the endpoint config schema.
 */

import { parseRateLimitOptions, RateLimitOptions } from "./ratelimit";

export const DEFAULT_RATE_LIMIT: RateLimitOptions = {
  maxRequestsPerMinute: 60,
  burstAllowance: 0,
};

export interface EndpointRateLimitConfig {
  enabled: boolean;
  options: RateLimitOptions;
}

export function resolveRateLimitConfig(
  raw: Record<string, unknown> | undefined
): EndpointRateLimitConfig {
  if (!raw || raw.enabled === false) {
    return { enabled: false, options: DEFAULT_RATE_LIMIT };
  }

  const options = parseRateLimitOptions(
    (raw.options as Record<string, unknown>) ?? {}
  );

  return { enabled: true, options };
}

export function applyRateLimitDefaults(
  config: Partial<EndpointRateLimitConfig>
): EndpointRateLimitConfig {
  return {
    enabled: config.enabled ?? false,
    options: {
      maxRequestsPerMinute:
        config.options?.maxRequestsPerMinute ??
        DEFAULT_RATE_LIMIT.maxRequestsPerMinute,
      burstAllowance:
        config.options?.burstAllowance ?? DEFAULT_RATE_LIMIT.burstAllowance,
    },
  };
}

export function rateLimitSummary(config: EndpointRateLimitConfig): string {
  if (!config.enabled) return "rate limiting disabled";
  const { maxRequestsPerMinute, burstAllowance } = config.options;
  return `rate limit: ${maxRequestsPerMinute} req/min, burst: +${burstAllowance}`;
}
