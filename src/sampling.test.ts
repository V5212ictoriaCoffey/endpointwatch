import {
  createSamplingStore,
  shouldSample,
  samplingStats,
  resetSampling,
  samplingSummary,
} from './sampling';
import {
  parseSamplingConfig,
  applySamplingDefaults,
  toSamplingOptions,
  samplingConfigSummary,
} from './sampling.config';

describe('sampling store', () => {
  it('always samples at rate 1.0', () => {
    const store = createSamplingStore({ rate: 1.0 });
    for (let i = 0; i < 20; i++) shouldSample(store);
    expect(store.sampled).toBe(20);
  });

  it('never samples at rate 0.0', () => {
    const store = createSamplingStore({ rate: 0.0 });
    for (let i = 0; i < 20; i++) shouldSample(store);
    expect(store.sampled).toBe(0);
  });

  it('clamps rate above 1', () => {
    const store = createSamplingStore({ rate: 5 });
    expect(store.rate).toBe(1);
  });

  it('clamps rate below 0', () => {
    const store = createSamplingStore({ rate: -1 });
    expect(store.rate).toBe(0);
  });

  it('tracks count and sampled', () => {
    const store = createSamplingStore({ rate: 1.0 });
    shouldSample(store);
    shouldSample(store);
    const stats = samplingStats(store);
    expect(stats.count).toBe(2);
    expect(stats.sampled).toBe(2);
    expect(stats.effectiveRate).toBe(1);
  });

  it('resets counters', () => {
    const store = createSamplingStore({ rate: 1.0 });
    shouldSample(store);
    resetSampling(store);
    expect(store.count).toBe(0);
    expect(store.sampled).toBe(0);
  });

  it('returns zero effectiveRate when count is 0', () => {
    const store = createSamplingStore({ rate: 0.5 });
    expect(samplingStats(store).effectiveRate).toBe(0);
  });

  it('formats summary', () => {
    const store = createSamplingStore({ rate: 0.5 });
    expect(samplingSummary(store)).toContain('rate=0.5');
  });
});

describe('sampling config', () => {
  it('parses rate and enabled', () => {
    const cfg = parseSamplingConfig({ samplingRate: 0.25, samplingEnabled: false });
    expect(cfg.rate).toBe(0.25);
    expect(cfg.enabled).toBe(false);
  });

  it('applies defaults', () => {
    const cfg = applySamplingDefaults({});
    expect(cfg.rate).toBe(1.0);
    expect(cfg.enabled).toBe(true);
  });

  it('returns null options when disabled', () => {
    const cfg = applySamplingDefaults({ enabled: false });
    expect(toSamplingOptions(cfg)).toBeNull();
  });

  it('returns options when enabled', () => {
    const cfg = applySamplingDefaults({ rate: 0.5 });
    expect(toSamplingOptions(cfg)).toEqual({ rate: 0.5 });
  });

  it('summarizes disabled config', () => {
    const cfg = applySamplingDefaults({ enabled: false });
    expect(samplingConfigSummary(cfg)).toBe('sampling: disabled');
  });
});
