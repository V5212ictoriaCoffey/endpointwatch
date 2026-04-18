import { describe, it, expect, vi } from 'vitest';
import {
  createWatchdog,
  watchdogAllow,
  watchdogSuccess,
  watchdogFailure,
  watchdogSummary,
} from './watchdog';

vi.mock('./pause', () => ({ isPaused: () => false }));
vi.mock('./mute', () => ({ isMuted: () => false }));

describe('watchdog', () => {
  it('allows requests initially', () => {
    const store = createWatchdog();
    expect(watchdogAllow(store, 'http://example.com')).toBe(true);
  });

  it('trips circuit after maxConsecutiveFailures', () => {
    const onTrip = vi.fn();
    const store = createWatchdog({ maxConsecutiveFailures: 2, onTrip });
    const url = 'http://example.com';
    watchdogFailure(store, url);
    expect(watchdogAllow(store, url)).toBe(true);
    watchdogFailure(store, url);
    expect(watchdogAllow(store, url)).toBe(false);
    expect(onTrip).toHaveBeenCalledWith(url);
  });

  it('resets on success', () => {
    const store = createWatchdog({ maxConsecutiveFailures: 2 });
    const url = 'http://api.test';
    watchdogFailure(store, url);
    watchdogSuccess(store, url);
    watchdogFailure(store, url);
    expect(watchdogAllow(store, url)).toBe(true);
  });

  it('calls onRecover when circuit closes', () => {
    const onRecover = vi.fn();
    const store = createWatchdog({ maxConsecutiveFailures: 1, cooldownMs: 0, onRecover });
    const url = 'http://recover.test';
    watchdogFailure(store, url);
    watchdogSuccess(store, url);
    expect(onRecover).toHaveBeenCalledWith(url);
  });

  it('summarizes circuit states', () => {
    const store = createWatchdog({ maxConsecutiveFailures: 1 });
    watchdogFailure(store, 'http://a.com');
    watchdogSuccess(store, 'http://b.com');
    const summary = watchdogSummary(store);
    expect(summary['http://a.com']).toBe('open');
    expect(summary['http://b.com']).toBe('closed');
  });
});
