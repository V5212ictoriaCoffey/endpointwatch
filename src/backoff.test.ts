import {
  computeDelay,
  createBackoffState,
  nextDelay,
  resetBackoff,
  backoffSummary,
  defaultBackoffOptions,
  BackoffOptions,
} from './backoff';

describe('computeDelay', () => {
  it('returns base delay for fixed strategy', () => {
    const opts: BackoffOptions = { strategy: 'fixed', baseMs: 1000, maxMs: 10000, jitter: false };
    expect(computeDelay(opts, 0)).toBe(1000);
    expect(computeDelay(opts, 5)).toBe(1000);
  });

  it('scales linearly for linear strategy', () => {
    const opts: BackoffOptions = { strategy: 'linear', baseMs: 500, maxMs: 10000, jitter: false };
    expect(computeDelay(opts, 0)).toBe(500);
    expect(computeDelay(opts, 1)).toBe(1000);
    expect(computeDelay(opts, 3)).toBe(2000);
  });

  it('scales exponentially for exponential strategy', () => {
    const opts: BackoffOptions = { strategy: 'exponential', baseMs: 100, maxMs: 10000, jitter: false, multiplier: 2 };
    expect(computeDelay(opts, 0)).toBe(100);
    expect(computeDelay(opts, 1)).toBe(200);
    expect(computeDelay(opts, 3)).toBe(800);
  });

  it('caps delay at maxMs', () => {
    const opts: BackoffOptions = { strategy: 'exponential', baseMs: 1000, maxMs: 3000, jitter: false, multiplier: 2 };
    expect(computeDelay(opts, 5)).toBe(3000);
  });

  it('applies jitter to reduce delay', () => {
    const opts: BackoffOptions = { strategy: 'fixed', baseMs: 1000, maxMs: 10000, jitter: true };
    const delay = computeDelay(opts, 0);
    expect(delay).toBeGreaterThanOrEqual(500);
    expect(delay).toBeLessThanOrEqual(1000);
  });
});

describe('createBackoffState', () => {
  it('initializes with zeroed state', () => {
    const state = createBackoffState();
    expect(state.attempt).toBe(0);
    expect(state.lastDelayMs).toBe(0);
  });
});

describe('nextDelay', () => {
  it('increments attempt on each call', () => {
    const opts: BackoffOptions = { strategy: 'fixed', baseMs: 200, maxMs: 5000, jitter: false };
    const state = createBackoffState();
    nextDelay(opts, state);
    expect(state.attempt).toBe(1);
    nextDelay(opts, state);
    expect(state.attempt).toBe(2);
  });

  it('records lastDelayMs', () => {
    const opts: BackoffOptions = { strategy: 'fixed', baseMs: 300, maxMs: 5000, jitter: false };
    const state = createBackoffState();
    nextDelay(opts, state);
    expect(state.lastDelayMs).toBe(300);
  });
});

describe('resetBackoff', () => {
  it('resets state to zero', () => {
    const opts = defaultBackoffOptions;
    const state = createBackoffState();
    nextDelay(opts, state);
    nextDelay(opts, state);
    resetBackoff(state);
    expect(state.attempt).toBe(0);
    expect(state.lastDelayMs).toBe(0);
  });
});

describe('backoffSummary', () => {
  it('returns a readable summary string', () => {
    const summary = backoffSummary(defaultBackoffOptions);
    expect(summary).toContain('exponential');
    expect(summary).toContain('500ms');
    expect(summary).toContain('30000ms');
  });
});
