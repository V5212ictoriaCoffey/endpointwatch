/**
 * Jitter strategies for spreading request load and avoiding thundering herd.
 */

export type JitterStrategy = "none" | "full" | "equal" | "decorrelated";

export interface JitterOptions {
  strategy: JitterStrategy;
  minMs: number;
  maxMs: number;
  seed?: number;
}

export interface JitterState {
  lastDelay: number;
}

export function createJitterState(): JitterState {
  return { lastDelay: 0 };
}

/**
 * Apply jitter to a base delay according to the chosen strategy.
 */
export function applyJitter(
  baseMs: number,
  opts: JitterOptions,
  state: JitterState
): number {
  const { strategy, minMs, maxMs } = opts;
  const rand = () => Math.random();

  let delay: number;

  switch (strategy) {
    case "none":
      delay = baseMs;
      break;

    case "full":
      // Uniform random between 0 and baseMs
      delay = rand() * baseMs;
      break;

    case "equal":
      // Half fixed, half random
      delay = baseMs / 2 + rand() * (baseMs / 2);
      break;

    case "decorrelated":
      // AWS-style: random between minMs and 3 * lastDelay
      delay = minMs + rand() * (Math.max(minMs, state.lastDelay) * 3 - minMs);
      break;

    default:
      delay = baseMs;
  }

  const clamped = Math.min(Math.max(delay, minMs), maxMs);
  state.lastDelay = clamped;
  return Math.round(clamped);
}

export function jitterSummary(opts: JitterOptions): string {
  return `jitter strategy=${opts.strategy} min=${opts.minMs}ms max=${opts.maxMs}ms`;
}
