/**
 * limiter.ts — Concurrency limiter for controlling simultaneous in-flight requests
 */

export interface LimiterOptions {
  maxConcurrent: number;
}

export interface LimiterState {
  active: number;
  queued: number;
  maxConcurrent: number;
}

export interface ConcurrencyLimiter {
  acquire(): Promise<() => void>;
  state(): LimiterState;
  drain(): Promise<void>;
}

export function createLimiter(options: LimiterOptions): ConcurrencyLimiter {
  const { maxConcurrent } = options;
  if (maxConcurrent < 1) throw new Error("maxConcurrent must be >= 1");

  let active = 0;
  const queue: Array<() => void> = [];

  function release() {
    active--;
    if (queue.length > 0) {
      const next = queue.shift()!;
      active++;
      next();
    }
  }

  function acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const proceed = () => resolve(release);
      if (active < maxConcurrent) {
        active++;
        proceed();
      } else {
        queue.push(proceed);
      }
    });
  }

  function state(): LimiterState {
    return { active, queued: queue.length, maxConcurrent };
  }

  function drain(): Promise<void> {
    if (active === 0 && queue.length === 0) return Promise.resolve();
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (active === 0 && queue.length === 0) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });
  }

  return { acquire, state, drain };
}

export function limiterSummary(limiter: ConcurrencyLimiter): string {
  const s = limiter.state();
  return `concurrency=${s.maxConcurrent} active=${s.active} queued=${s.queued}`;
}
