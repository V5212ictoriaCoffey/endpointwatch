import { createThrottle, parseThrottleOptions } from './throttle';
import { resolveThrottleConfig, applyThrottleDefaults, throttleSummary } from './throttle.config';

describe('parseThrottleOptions', () => {
  it('uses defaults for missing fields', () => {
    const opts = parseThrottleOptions({});
    expect(opts.minIntervalMs).toBe(0);
    expect(opts.maxConcurrent).toBe(10);
  });

  it('parses provided values', () => {
    const opts = parseThrottleOptions({ minIntervalMs: 100, maxConcurrent: 3 });
    expect(opts.minIntervalMs).toBe(100);
    expect(opts.maxConcurrent).toBe(3);
  });
});

describe('createThrottle', () => {
  it('allows up to maxConcurrent acquires without blocking', async () => {
    const t = createThrottle({ minIntervalMs: 0, maxConcurrent: 3 });
    await t.acquire();
    await t.acquire();
    await t.acquire();
    expect(t.stats().active).toBe(3);
    expect(t.stats().totalAcquired).toBe(3);
  });

  it('release decrements active count', async () => {
    const t = createThrottle({ minIntervalMs: 0, maxConcurrent: 2 });
    await t.acquire();
    t.release();
    expect(t.stats().active).toBe(0);
  });

  it('queues requests beyond maxConcurrent', async () => {
    const t = createThrottle({ minIntervalMs: 0, maxConcurrent: 1 });
    await t.acquire();
    let resolved = false;
    t.acquire().then(() => { resolved = true; t.release(); });
    expect(t.stats().queued).toBe(1);
    t.release();
    await Promise.resolve();
    expect(resolved).toBe(true);
  });
});

describe('resolveThrottleConfig', () => {
  it('returns defaults when no config given', () => {
    const cfg = resolveThrottleConfig();
    expect(cfg.enabled).toBe(false);
    expect(cfg.maxConcurrent).toBe(10);
  });

  it('parses enabled flag', () => {
    const cfg = resolveThrottleConfig({ enabled: true, maxConcurrent: 5, minIntervalMs: 50 });
    expect(cfg.enabled).toBe(true);
    expect(cfg.maxConcurrent).toBe(5);
  });
});

describe('throttleSummary', () => {
  it('reports disabled', () => {
    expect(throttleSummary(applyThrottleDefaults({}))).toContain('disabled');
  });

  it('reports config when enabled', () => {
    const summary = throttleSummary(applyThrottleDefaults({ enabled: true, maxConcurrent: 4, minIntervalMs: 200 }));
    expect(summary).toContain('maxConcurrent=4');
    expect(summary).toContain('200ms');
  });
});
