/**
 * Backoff strategies for retry scheduling.
 * Supports fixed, linear, and exponential backoff with optional jitter.
 */

export type BackoffStrategy = 'fixed' | 'linear' | 'exponential';

export interface BackoffOptions {
  strategy: BackoffStrategy;
  baseMs: number;
  maxMs: number;
  jitter: boolean;
  multiplier?: number;
}

export interface BackoffState {
  attempt: number;
  lastDelayMs: number;
}

export const defaultBackoffOptions: BackoffOptions = {
  strategy: 'exponential',
  baseMs: 500,
  maxMs: 30000,
  jitter: true,
  multiplier: 2,
};

export function computeDelay(options: BackoffOptions, attempt: number): number {
  const { strategy, baseMs, maxMs, jitter, multiplier = 2 } = options;

  let delay: number;

  switch (strategy) {
    case 'fixed':
      delay = baseMs;
      break;
    case 'linear':
      delay = baseMs * (attempt + 1);
      break;
    case 'exponential':
    default:
      delay = baseMs * Math.pow(multiplier, attempt);
      break;
  }

  delay = Math.min(delay, maxMs);

  if (jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }

  return Math.floor(delay);
}

export function createBackoffState(): BackoffState {
  return { attempt: 0, lastDelayMs: 0 };
}

export function nextDelay(options: BackoffOptions, state: BackoffState): number {
  const delay = computeDelay(options, state.attempt);
  state.lastDelayMs = delay;
  state.attempt += 1;
  return delay;
}

export function resetBackoff(state: BackoffState): void {
  state.attempt = 0;
  state.lastDelayMs = 0;
}

export function backoffSummary(options: BackoffOptions): string {
  return `strategy=${options.strategy} base=${options.baseMs}ms max=${options.maxMs}ms jitter=${options.jitter}`;
}
