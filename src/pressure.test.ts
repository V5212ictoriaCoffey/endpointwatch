import {
  createPressureStore,
  computePressureScore,
  resolveLevel,
  evaluatePressure,
  recordPressure,
  averagePressure,
  pressureSummary,
  PressureInput,
} from './pressure';

function makeInput(overrides: Partial<PressureInput> = {}): PressureInput {
  return {
    url: 'https://api.example.com/health',
    errorRate: 0,
    avgLatency: 100,
    latencyThreshold: 500,
    circuitOpen: false,
    ...overrides,
  };
}

describe('computePressureScore', () => {
  it('returns 0 for a perfectly healthy endpoint', () => {
    const score = computePressureScore(makeInput());
    expect(score).toBe(0);
  });

  it('reflects high error rate', () => {
    const score = computePressureScore(makeInput({ errorRate: 1 }));
    expect(score).toBeGreaterThanOrEqual(0.4);
  });

  it('reflects latency exceeding threshold', () => {
    const score = computePressureScore(makeInput({ avgLatency: 1000, latencyThreshold: 500 }));
    expect(score).toBeGreaterThan(0);
  });

  it('adds circuit-open component', () => {
    const open = computePressureScore(makeInput({ circuitOpen: true }));
    const closed = computePressureScore(makeInput({ circuitOpen: false }));
    expect(open).toBeGreaterThan(closed);
  });

  it('clamps score to [0, 1]', () => {
    const score = computePressureScore(makeInput({ errorRate: 2, avgLatency: 9999, circuitOpen: true }));
    expect(score).toBeLessThanOrEqual(1);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('resolveLevel', () => {
  it.each([
    [0, 'low'],
    [0.29, 'low'],
    [0.3, 'moderate'],
    [0.6, 'high'],
    [0.85, 'critical'],
    [1, 'critical'],
  ] as const)('score %d => %s', (score, expected) => {
    expect(resolveLevel(score)).toBe(expected);
  });
});

describe('evaluatePressure', () => {
  it('returns low level for healthy input', () => {
    const result = evaluatePressure(makeInput());
    expect(result.level).toBe('low');
    expect(result.reasons).toHaveLength(0);
  });

  it('includes reason for open circuit', () => {
    const result = evaluatePressure(makeInput({ circuitOpen: true }));
    expect(result.reasons).toContain('circuit is open');
  });

  it('includes reason for high error rate', () => {
    const result = evaluatePressure(makeInput({ errorRate: 0.5 }));
    expect(result.reasons.some(r => r.includes('error rate'))).toBe(true);
  });

  it('includes reason for latency breach', () => {
    const result = evaluatePressure(makeInput({ avgLatency: 800, latencyThreshold: 500 }));
    expect(result.reasons.some(r => r.includes('latency'))).toBe(true);
  });
});

describe('pressure store', () => {
  it('records and averages pressure scores', () => {
    const store = createPressureStore();
    recordPressure(store, 'https://api.example.com', 0.2);
    recordPressure(store, 'https://api.example.com', 0.4);
    expect(averagePressure(store, 'https://api.example.com')).toBeCloseTo(0.3);
  });

  it('returns 0 for unknown url', () => {
    const store = createPressureStore();
    expect(averagePressure(store, 'https://unknown.example.com')).toBe(0);
  });

  it('trims history beyond maxHistory', () => {
    const store = createPressureStore();
    for (let i = 0; i < 25; i++) recordPressure(store, 'u', 0.5, 20);
    expect(store.history.get('u')!.length).toBe(20);
  });

  it('pressureSummary includes url and stats', () => {
    const store = createPressureStore();
    recordPressure(store, 'https://api.example.com/health', 0.6);
    const summary = pressureSummary(store);
    expect(summary).toContain('https://api.example.com/health');
    expect(summary).toContain('avg=');
  });
});
