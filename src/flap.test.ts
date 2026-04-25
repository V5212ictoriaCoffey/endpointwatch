import {
  createFlapStore,
  recordTransition,
  isFlapping,
  resetFlap,
  flapSummary,
  pruneWindow,
} from './flap';

const BASE = 1_000_000;

describe('flap', () => {
  it('starts with no flapping state', () => {
    const store = createFlapStore();
    expect(isFlapping(store, 'https://example.com')).toBe(false);
  });

  it('detects flapping after threshold transitions', () => {
    const store = createFlapStore({ windowMs: 60_000, threshold: 4 });
    for (let i = 0; i < 4; i++) {
      recordTransition(store, 'https://api.example.com', BASE + i * 1000);
    }
    expect(isFlapping(store, 'https://api.example.com')).toBe(true);
  });

  it('does not flag as flapping below threshold', () => {
    const store = createFlapStore({ windowMs: 60_000, threshold: 4 });
    for (let i = 0; i < 3; i++) {
      recordTransition(store, 'https://api.example.com', BASE + i * 1000);
    }
    expect(isFlapping(store, 'https://api.example.com')).toBe(false);
  });

  it('prunes transitions outside the window', () => {
    const store = createFlapStore({ windowMs: 5_000, threshold: 3 });
    recordTransition(store, 'https://api.example.com', BASE);
    recordTransition(store, 'https://api.example.com', BASE + 1000);
    recordTransition(store, 'https://api.example.com', BASE + 2000);
    // Now advance time so old transitions fall outside the window
    pruneWindow(store, 'https://api.example.com', BASE + 10_000);
    expect(isFlapping(store, 'https://api.example.com')).toBe(false);
  });

  it('resets flap state', () => {
    const store = createFlapStore({ threshold: 2 });
    recordTransition(store, 'https://api.example.com', BASE);
    recordTransition(store, 'https://api.example.com', BASE + 100);
    expect(isFlapping(store, 'https://api.example.com')).toBe(true);
    resetFlap(store, 'https://api.example.com');
    expect(isFlapping(store, 'https://api.example.com')).toBe(false);
  });

  it('flapSummary returns no-flapping message when clean', () => {
    const store = createFlapStore();
    expect(flapSummary(store)).toBe('No flapping endpoints detected.');
  });

  it('flapSummary lists flapping endpoints', () => {
    const store = createFlapStore({ threshold: 2 });
    recordTransition(store, 'https://a.com', BASE);
    recordTransition(store, 'https://a.com', BASE + 100);
    const summary = flapSummary(store);
    expect(summary).toContain('https://a.com');
    expect(summary).toContain('1');
  });

  it('handles multiple URLs independently', () => {
    const store = createFlapStore({ threshold: 2 });
    recordTransition(store, 'https://a.com', BASE);
    recordTransition(store, 'https://a.com', BASE + 100);
    recordTransition(store, 'https://b.com', BASE);
    expect(isFlapping(store, 'https://a.com')).toBe(true);
    expect(isFlapping(store, 'https://b.com')).toBe(false);
  });
});
