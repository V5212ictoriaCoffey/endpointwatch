import { createRateLimiter, parseRateLimitOptions } from './ratelimit';
import { resolveRateLimitConfig } from './ratelimit.config';
import type { RateLimitOptions } from './ratelimit';

export interface RateLimitMiddlewareOptions {
  windowMs?: number;
  maxRequests?: number;
  keyBy?: 'url' | 'global';
  onThrottled?: (key: string, remaining: number) => void;
}

export interface RateLimitContext {
  url: string;
  [key: string]: unknown;
}

export interface RateLimitMiddleware {
  allow: (ctx: RateLimitContext) => boolean;
  remaining: (ctx: RateLimitContext) => number;
  reset: (key?: string) => void;
  summary: () => string;
}

export function createRateLimitMiddleware(
  raw: Partial<RateLimitMiddlewareOptions> = {}
): RateLimitMiddleware {
  const config = resolveRateLimitConfig(raw);
  const options: RateLimitOptions = parseRateLimitOptions(config);
  const limiter = createRateLimiter(options);

  const resolveKey = (ctx: RateLimitContext): string =>
    raw.keyBy === 'global' ? '__global__' : ctx.url;

  function allow(ctx: RateLimitContext): boolean {
    const key = resolveKey(ctx);
    const permitted = limiter.check(key);
    if (!permitted && raw.onThrottled) {
      raw.onThrottled(key, limiter.remaining(key));
    }
    return permitted;
  }

  function remaining(ctx: RateLimitContext): number {
    return limiter.remaining(resolveKey(ctx));
  }

  function reset(key?: string): void {
    if (key) {
      limiter.reset(key);
    } else {
      limiter.resetAll();
    }
  }

  function summary(): string {
    return [
      `RateLimitMiddleware:`,
      `  windowMs=${options.windowMs}`,
      `  maxRequests=${options.maxRequests}`,
      `  keyBy=${raw.keyBy ?? 'url'}`,
    ].join('\n');
  }

  return { allow, remaining, reset, summary };
}
