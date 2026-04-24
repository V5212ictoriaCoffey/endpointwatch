import type { RateLimitMiddlewareOptions } from './ratelimit.middleware';

export const defaultMiddlewareConfig: Required<
  Omit<RateLimitMiddlewareOptions, 'onThrottled'>
> = {
  windowMs: 60_000,
  maxRequests: 60,
  keyBy: 'url',
};

export function parseMiddlewareConfig(
  raw: Record<string, unknown>
): Partial<RateLimitMiddlewareOptions> {
  const out: Partial<RateLimitMiddlewareOptions> = {};

  if (typeof raw['windowMs'] === 'number' && raw['windowMs'] > 0) {
    out.windowMs = raw['windowMs'];
  }
  if (typeof raw['maxRequests'] === 'number' && raw['maxRequests'] > 0) {
    out.maxRequests = raw['maxRequests'];
  }
  if (raw['keyBy'] === 'url' || raw['keyBy'] === 'global') {
    out.keyBy = raw['keyBy'];
  }

  return out;
}

export function applyMiddlewareDefaults(
  partial: Partial<RateLimitMiddlewareOptions>
): Required<Omit<RateLimitMiddlewareOptions, 'onThrottled'>> {
  return {
    windowMs: partial.windowMs ?? defaultMiddlewareConfig.windowMs,
    maxRequests: partial.maxRequests ?? defaultMiddlewareConfig.maxRequests,
    keyBy: partial.keyBy ?? defaultMiddlewareConfig.keyBy,
  };
}

export function middlewareConfigSummary(
  cfg: Required<Omit<RateLimitMiddlewareOptions, 'onThrottled'>>
): string {
  return [
    `window=${cfg.windowMs}ms`,
    `max=${cfg.maxRequests} req`,
    `keyBy=${cfg.keyBy}`,
  ].join(', ');
}
