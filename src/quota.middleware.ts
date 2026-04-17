import { createQuotaStore, checkQuota, quotaRemaining, QuotaOptions, QuotaStore } from './quota';

export interface QuotaMiddlewareOptions extends QuotaOptions {
  onExceeded?: (endpoint: string, remaining: number) => void;
}

export interface QuotaMiddleware {
  store: QuotaStore;
  allow: (endpoint: string) => boolean;
  remaining: (endpoint: string) => number;
  reset: (endpoint: string) => void;
}

export function createQuotaMiddleware(options: QuotaMiddlewareOptions): QuotaMiddleware {
  const store = createQuotaStore();

  function allow(endpoint: string): boolean {
    const ok = checkQuota(store, endpoint, options);
    if (!ok && options.onExceeded) {
      const rem = quotaRemaining(store, endpoint, options);
      options.onExceeded(endpoint, rem);
    }
    return ok;
  }

  function remaining(endpoint: string): number {
    return quotaRemaining(store, endpoint, options);
  }

  function reset(endpoint: string): void {
    delete store[endpoint];
  }

  return { store, allow, remaining, reset };
}
