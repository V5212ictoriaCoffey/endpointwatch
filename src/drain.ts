/**
 * drain.ts — Graceful shutdown drain logic for in-flight monitors.
 * Tracks active probe counts and resolves when all finish or timeout expires.
 */

export interface DrainStore {
  active: number;
  draining: boolean;
  resolve: (() => void) | null;
  timeoutHandle: ReturnType<typeof setTimeout> | null;
}

export function createDrainStore(): DrainStore {
  return { active: 0, draining: false, resolve: null, timeoutHandle: null };
}

export function acquireDrain(store: DrainStore): void {
  if (!store.draining) {
    store.active += 1;
  }
}

export function releaseDrain(store: DrainStore): void {
  if (store.active > 0) {
    store.active -= 1;
  }
  if (store.draining && store.active === 0) {
    _finish(store);
  }
}

export function drainAll(
  store: DrainStore,
  timeoutMs: number = 5000
): Promise<void> {
  if (store.active === 0) {
    return Promise.resolve();
  }
  store.draining = true;
  return new Promise<void>((resolve) => {
    store.resolve = resolve;
    store.timeoutHandle = setTimeout(() => {
      _finish(store);
    }, timeoutMs);
  });
}

export function isDraining(store: DrainStore): boolean {
  return store.draining;
}

export function drainSummary(store: DrainStore): string {
  return `drain: active=${store.active} draining=${store.draining}`;
}

function _finish(store: DrainStore): void {
  if (store.timeoutHandle !== null) {
    clearTimeout(store.timeoutHandle);
    store.timeoutHandle = null;
  }
  if (store.resolve) {
    const r = store.resolve;
    store.resolve = null;
    r();
  }
}
