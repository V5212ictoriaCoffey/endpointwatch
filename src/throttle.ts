export interface ThrottleOptions {
  minIntervalMs: number;
  maxConcurrent: number;
}

export interface ThrottleHandle {
  acquire: () => Promise<void>;
  release: () => void;
  stats: () => ThrottleStats;
}

export interface ThrottleStats {
  active: number;
  queued: number;
  totalAcquired: number;
}

export function parseThrottleOptions(raw: Record<string, unknown>): ThrottleOptions {
  return {
    minIntervalMs: typeof raw.minIntervalMs === 'number' ? raw.minIntervalMs : 0,
    maxConcurrent: typeof raw.maxConcurrent === 'number' ? raw.maxConcurrent : 10,
  };
}

export function createThrottle(opts: ThrottleOptions): ThrottleHandle {
  let active = 0;
  let totalAcquired = 0;
  const queue: Array<() => void> = [];
  let lastAcquireTime = 0;

  function tryFlush() {
    if (queue.length === 0 || active >= opts.maxConcurrent) return;
    const now = Date.now();
    const elapsed = now - lastAcquireTime;
    if (elapsed < opts.minIntervalMs) {
      setTimeout(tryFlush, opts.minIntervalMs - elapsed);
      return;
    }
    const resolve = queue.shift()!;
    active++;
    totalAcquired++;
    lastAcquireTime = Date.now();
    resolve();
  }

  return {
    acquire(): Promise<void> {
      return new Promise((resolve) => {
        queue.push(resolve);
        tryFlush();
      });
    },
    release() {
      active = Math.max(0, active - 1);
      tryFlush();
    },
    stats(): ThrottleStats {
      return { active, queued: queue.length, totalAcquired };
    },
  };
}
