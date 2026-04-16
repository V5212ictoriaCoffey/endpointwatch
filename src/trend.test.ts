import { analyzeTrend, trendSummary } from './trend';

describe('analyzeTrend', () => {
  it('returns stable for single value', () => {
    const r = analyzeTrend([100]);
    expect(r.direction).toBe('stable');
    expect(r.changePercent).toBe(0);
  });

  it('returns stable when change is within threshold', () => {
    const latencies = [100, 102, 101, 103, 100, 102, 101, 100, 103, 102];
    const r = analyzeTrend(latencies);
    expect(r.direction).toBe('stable');
  });

  it('detects degrading trend', () => {
    const latencies = [100, 100, 100, 100, 100, 200, 200, 200, 200, 200];
    const r = analyzeTrend(latencies);
    expect(r.direction).toBe('degrading');
    expect(r.changePercent).toBeGreaterThan(0);
  });

  it('detects improving trend', () => {
    const latencies = [200, 200, 200, 200, 200, 100, 100, 100, 100, 100];
    const r = analyzeTrend(latencies);
    expect(r.direction).toBe('improving');
    expect(r.changePercent).toBeLessThan(0);
  });

  it('respects custom windowSize', () => {
    const latencies = [100, 100, 100, 100, 300, 300, 300, 300];
    const r = analyzeTrend(latencies, { windowSize: 4 });
    expect(r.windowSize).toBe(4);
  });

  it('respects custom thresholds', () => {
    const latencies = [100, 100, 100, 100, 100, 105, 105, 105, 105, 105];
    const loose = analyzeTrend(latencies, { degradeThreshold: 10 });
    expect(loose.direction).toBe('stable');
    const strict = analyzeTrend(latencies, { degradeThreshold: 3 });
    expect(strict.direction).toBe('degrading');
  });

  it('handles zero baseline gracefully', () => {
    const r = analyzeTrend([0, 0, 0, 0]);
    expect(r.direction).toBe('stable');
  });
});

describe('trendSummary', () => {
  it('formats degrading trend', () => {
    const s = trendSummary({ direction: 'degrading', changePercent: 15.5, windowSize: 10 });
    expect(s).toContain('degrading');
    expect(s).toContain('+15.5%');
  });

  it('formats improving trend', () => {
    const s = trendSummary({ direction: 'improving', changePercent: -20, windowSize: 8 });
    expect(s).toContain('improving');
    expect(s).toContain('-20%');
  });
});
