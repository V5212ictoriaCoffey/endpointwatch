import { describe, it, expect, vi } from 'vitest';
import { createRateLimitMiddleware } from './ratelimit.middleware';
import {
  parseMiddlewareConfig,
  applyMiddlewareDefaults,
  middlewareConfigSummary,
  defaultMiddlewareConfig,
} from './ratelimit.middleware.config';

function makeCtx(url = 'https://api.example.com/health') {
  return { url };
}

describe('createRateLimitMiddleware', () => {
  it('allows requests within the limit', () => {
    const mw = createRateLimitMiddleware({ maxRequests: 5, windowMs: 60_000 });
    const ctx = makeCtx();
    for (let i = 0; i < 5; i++) {
      expect(mw.allow(ctx)).toBe(true);
    }
  });

  it('blocks requests exceeding the limit', () => {
    const mw = createRateLimitMiddleware({ maxRequests: 2, windowMs: 60_000 });
    const ctx = makeCtx();
    mw.allow(ctx);
    mw.allow(ctx);
    expect(mw.allow(ctx)).toBe(false);
  });

  it('calls onThrottled when blocked', () => {
    const onThrottled = vi.fn();
    const mw = createRateLimitMiddleware({ maxRequests: 1, windowMs: 60_000, onThrottled });
    const ctx = makeCtx();
    mw.allow(ctx);
    mw.allow(ctx);
    expect(onThrottled).toHaveBeenCalledOnce();
    expect(onThrottled.mock.calls[0][0]).toBe(ctx.url);
  });

  it('tracks remaining correctly', () => {
    const mw = createRateLimitMiddleware({ maxRequests: 3, windowMs: 60_000 });
    const ctx = makeCtx();
    mw.allow(ctx);
    expect(mw.remaining(ctx)).toBe(2);
  });

  it('uses global key when keyBy=global', () => {
    const mw = createRateLimitMiddleware({ maxRequests: 2, windowMs: 60_000, keyBy: 'global' });
    mw.allow(makeCtx('https://a.com'));
    mw.allow(makeCtx('https://b.com'));
    expect(mw.allow(makeCtx('https://c.com'))).toBe(false);
  });

  it('resets a specific key', () => {
    const mw = createRateLimitMiddleware({ maxRequests: 1, windowMs: 60_000 });
    const ctx = makeCtx();
    mw.allow(ctx);
    mw.reset(ctx.url);
    expect(mw.allow(ctx)).toBe(true);
  });

  it('summary returns expected string', () => {
    const mw = createRateLimitMiddleware({ maxRequests: 10, windowMs: 30_000, keyBy: 'url' });
    expect(mw.summary()).toContain('windowMs=30000');
    expect(mw.summary()).toContain('maxRequests=10');
  });
});

describe('parseMiddlewareConfig', () => {
  it('parses valid config', () => {
    const result = parseMiddlewareConfig({ windowMs: 5000, maxRequests: 20, keyBy: 'global' });
    expect(result).toEqual({ windowMs: 5000, maxRequests: 20, keyBy: 'global' });
  });

  it('ignores invalid values', () => {
    const result = parseMiddlewareConfig({ windowMs: -1, maxRequests: 'bad', keyBy: 'invalid' });
    expect(result).toEqual({});
  });
});

describe('applyMiddlewareDefaults', () => {
  it('fills in missing fields with defaults', () => {
    const result = applyMiddlewareDefaults({});
    expect(result).toEqual(defaultMiddlewareConfig);
  });
});

describe('middlewareConfigSummary', () => {
  it('formats summary string', () => {
    const summary = middlewareConfigSummary({ windowMs: 60_000, maxRequests: 60, keyBy: 'url' });
    expect(summary).toBe('window=60000ms, max=60 req, keyBy=url');
  });
});
