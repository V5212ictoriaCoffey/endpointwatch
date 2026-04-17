import { describe, it, expect, beforeEach } from 'vitest';
import { createQuotaStore, checkQuota, quotaRemaining, resetQuota } from './quota';
import { resolveQuotaOptions, quotaSummary } from './quota.config';
import { createQuotaMiddleware } from './quota.middleware';

const opts = { maxRequests: 3, windowMs: 1000 };

describe('checkQuota', () => {
  it('allows up to maxRequests', () => {
    const store = createQuotaStore();
    expect(checkQuota(store, 'a', opts, 0)).toBe(true);
    expect(checkQuota(store, 'a', opts, 1)).toBe(true);
    expect(checkQuota(store, 'a', opts, 2)).toBe(true);
    expect(checkQuota(store, 'a', opts, 3)).toBe(false);
  });

  it('resets after window expires', () => {
    const store = createQuotaStore();
    checkQuota(store, 'a', opts, 0);
    checkQuota(store, 'a', opts, 1);
    checkQuota(store, 'a', opts, 2);
    expect(checkQuota(store, 'a', opts, 1001)).toBe(true);
  });

  it('tracks endpoints independently', () => {
    const store = createQuotaStore();
    checkQuota(store, 'a', opts, 0);
    expect(checkQuota(store, 'b', opts, 0)).toBe(true);
  });
});

describe('quotaRemaining', () => {
  it('returns full quota for unknown endpoint', () => {
    const store = createQuotaStore();
    expect(quotaRemaining(store, 'x', opts)).toBe(3);
  });

  it('decrements correctly', () => {
    const store = createQuotaStore();
    checkQuota(store, 'x', opts, 0);
    checkQuota(store, 'x', opts, 1);
    expect(quotaRemaining(store, 'x', opts, 2)).toBe(1);
  });
});

describe('resetQuota', () => {
  it('clears the endpoint state', () => {
    const store = createQuotaStore();
    checkQuota(store, 'a', opts, 0);
    resetQuota(store, 'a');
    expect(quotaRemaining(store, 'a', opts)).toBe(3);
  });
});

describe('resolveQuotaOptions', () => {
  it('applies defaults', () => {
    const o = resolveQuotaOptions({});
    expect(o.maxRequests).toBe(60);
    expect(o.windowMs).toBe(60_000);
  });

  it('overrides with provided values', () => {
    const o = resolveQuotaOptions({ maxRequests: 10, windowMs: 5000 });
    expect(o.maxRequests).toBe(10);
  });
});

describe('quotaSummary', () => {
  it('formats string', () => {
    expect(quotaSummary({ maxRequests: 5, windowMs: 2000 })).toContain('5 requests per 2000ms');
  });
});

describe('createQuotaMiddleware', () => {
  it('calls onExceeded when quota exceeded', () => {
    let called = false;
    const mw = createQuotaMiddleware({ ...opts, onExceeded: () => { called = true; } });
    mw.allow('e'); mw.allow('e'); mw.allow('e');
    mw.allow('e');
    expect(called).toBe(true);
  });

  it('reset restores quota', () => {
    const mw = createQuotaMiddleware(opts);
    mw.allow('e'); mw.allow('e'); mw.allow('e');
    mw.reset('e');
    expect(mw.allow('e')).toBe(true);
  });
});
