export interface QuotaOptions {
  maxRequests: number;
  windowMs: number;
}

export interface QuotaState {
  count: number;
  windowStart: number;
}

export interface QuotaStore {
  [endpoint: string]: QuotaState;
}

export function createQuotaStore(): QuotaStore {
  return {};
}

export function checkQuota(
  store: QuotaStore,
  endpoint: string,
  options: QuotaOptions,
  now = Date.now()
): boolean {
  const state = store[endpoint];
  if (!state || now - state.windowStart >= options.windowMs) {
    store[endpoint] = { count: 1, windowStart: now };
    return true;
  }
  if (state.count >= options.maxRequests) {
    return false;
  }
  state.count++;
  return true;
}

export function resetQuota(store: QuotaStore, endpoint: string): void {
  delete store[endpoint];
}

export function quotaRemaining(
  store: QuotaStore,
  endpoint: string,
  options: QuotaOptions,
  now = Date.now()
): number {
  const state = store[endpoint];
  if (!state || now - state.windowStart >= options.windowMs) return options.maxRequests;
  return Math.max(0, options.maxRequests - state.count);
}
