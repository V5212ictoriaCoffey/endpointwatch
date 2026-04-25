import { describe, it, expect } from 'vitest';
import {
  computeHealthScore,
  computeAllHealthScores,
  gradeFromScore,
  formatHealthScore,
  HealthScoreInput,
} from './healthscore';
import {
  parseHealthScoreConfig,
  applyHealthScoreDefaults,
  healthScoreConfigSummary,
} from './healthscore.config';

function makeInput(overrides: Partial<HealthScoreInput> = {}): HealthScoreInput {
  return {
    errorRate: 0,
    avgLatency: 100,
    latencyBudget: 500,
    slaTarget: 0.99,
    slaCurrent: 0.999,
    flapping: false,
    ...overrides,
  };
}

describe('gradeFromScore', () => {
  it('returns A for 90+', () => expect(gradeFromScore(95)).toBe('A'));
  it('returns B for 75–89', () => expect(gradeFromScore(80)).toBe('B'));
  it('returns C for 60–74', () => expect(gradeFromScore(65)).toBe('C'));
  it('returns D for 40–59', () => expect(gradeFromScore(50)).toBe('D'));
  it('returns F below 40', () => expect(gradeFromScore(20)).toBe('F'));
});

describe('computeHealthScore', () => {
  it('returns a perfect score for ideal input', () => {
    const result = computeHealthScore('https://api.example.com', makeInput());
    expect(result.score).toBeGreaterThanOrEqual(95);
    expect(result.grade).toBe('A');
  });

  it('penalises high error rate', () => {
    const good = computeHealthScore('https://a.com', makeInput({ errorRate: 0 }));
    const bad  = computeHealthScore('https://a.com', makeInput({ errorRate: 0.5 }));
    expect(bad.score).toBeLessThan(good.score);
    expect(bad.factors.availability).toBeLessThan(good.factors.availability);
  });

  it('penalises latency exceeding budget', () => {
    const result = computeHealthScore('https://a.com', makeInput({ avgLatency: 600, latencyBudget: 500 }));
    expect(result.factors.latency).toBe(0);
  });

  it('penalises SLA shortfall', () => {
    const result = computeHealthScore('https://a.com', makeInput({ slaCurrent: 0.97, slaTarget: 0.99 }));
    expect(result.factors.sla).toBeLessThan(100);
  });

  it('penalises flapping endpoints', () => {
    const stable   = computeHealthScore('https://a.com', makeInput({ flapping: false }));
    const flapping = computeHealthScore('https://a.com', makeInput({ flapping: true }));
    expect(flapping.score).toBeLessThan(stable.score);
    expect(flapping.factors.stability).toBe(0);
  });

  it('includes url and timestamp', () => {
    const result = computeHealthScore('https://x.com', makeInput());
    expect(result.url).toBe('https://x.com');
    expect(result.timestamp).toBeGreaterThan(0);
  });
});

describe('computeAllHealthScores', () => {
  it('returns one result per entry', () => {
    const entries = [
      { url: 'https://a.com', input: makeInput() },
      { url: 'https://b.com', input: makeInput({ errorRate: 0.2 }) },
    ];
    const results = computeAllHealthScores(entries);
    expect(results).toHaveLength(2);
    expect(results[0].url).toBe('https://a.com');
  });
});

describe('formatHealthScore', () => {
  it('includes grade, url, and score', () => {
    const result = computeHealthScore('https://api.com', makeInput());
    const line = formatHealthScore(result);
    expect(line).toContain('https://api.com');
    expect(line).toContain('score=');
    expect(line).toMatch(/\[A|B|C|D|F\]/);
  });
});

describe('parseHealthScoreConfig', () => {
  it('parses valid fields', () => {
    const cfg = parseHealthScoreConfig({ latencyBudget: 300, slaTarget: 0.995 });
    expect(cfg.latencyBudget).toBe(300);
    expect(cfg.slaTarget).toBe(0.995);
  });

  it('ignores invalid slaTarget', () => {
    const cfg = parseHealthScoreConfig({ slaTarget: 1.5 });
    expect(cfg.slaTarget).toBeUndefined();
  });
});

describe('applyHealthScoreDefaults', () => {
  it('fills missing fields with defaults', () => {
    const cfg = applyHealthScoreDefaults({});
    expect(cfg.latencyBudget).toBe(500);
    expect(cfg.slaTarget).toBe(0.99);
  });
});

describe('healthScoreConfigSummary', () => {
  it('returns a readable string', () => {
    const cfg = applyHealthScoreDefaults({ latencyBudget: 300 });
    const s = healthScoreConfigSummary(cfg);
    expect(s).toContain('300ms');
    expect(s).toContain('99.00%');
  });
});
