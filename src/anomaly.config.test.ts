import { describe, it, expect } from 'vitest';
import { parseAnomalyConfig, applyAnomalyDefaults, anomalyConfigSummary } from './anomaly.config';

describe('parseAnomalyConfig', () => {
  it('returns empty object when no anomalyDetection key', () => {
    expect(parseAnomalyConfig({})).toEqual({});
  });

  it('parses all fields', () => {
    const result = parseAnomalyConfig({
      anomalyDetection: { enabled: false, zScoreThreshold: 3.0, minSamples: 10 },
    });
    expect(result).toEqual({ enabled: false, zScoreThreshold: 3.0, minSamples: 10 });
  });

  it('ignores invalid types', () => {
    const result = parseAnomalyConfig({
      anomalyDetection: { enabled: 'yes', zScoreThreshold: '2', minSamples: null },
    });
    expect(result).toEqual({});
  });
});

describe('applyAnomalyDefaults', () => {
  it('fills in defaults', () => {
    const result = applyAnomalyDefaults({});
    expect(result.enabled).toBe(true);
    expect(result.zScoreThreshold).toBe(2.5);
    expect(result.minSamples).toBe(5);
  });

  it('overrides with provided values', () => {
    const result = applyAnomalyDefaults({ zScoreThreshold: 3.5 });
    expect(result.zScoreThreshold).toBe(3.5);
  });
});

describe('anomalyConfigSummary', () => {
  it('formats summary string', () => {
    const cfg = applyAnomalyDefaults({});
    const s = anomalyConfigSummary(cfg);
    expect(s).toContain('z-threshold=2.5');
    expect(s).toContain('minSamples=5');
  });
});
