/**
 * retrybudget.ts
 * Tracks retry usage per endpoint to prevent retry storms.
 * Enforces a configurable budget of retries within a rolling time window.
 */

export interface RetryBudgetOptions {
  maxRetries: number;   // total retries allowed in the window
  windowMs: number;     // rolling window duration in ms
}

export interface RetryBudgetEntry {
  timestamp: number;
}

export interface RetryBudgetStore {
  budgets: Map<string, RetryBudgetEntry[]>;
  options: RetryBudgetOptions;
}

export function createRetryBudgetStore(options: RetryBudgetOptions): RetryBudgetStore {
  return { budgets: new Map(), options };
}

function pruneWindow(entries: RetryBudgetEntry[], windowMs: number, now: number): RetryBudgetEntry[] {
  return entries.filter(e => now - e.timestamp < windowMs);
}

export function consumeRetry(store: RetryBudgetStore, url: string): boolean {
  const now = Date.now();
  const existing = pruneWindow(store.budgets.get(url) ?? [], store.options.windowMs, now);
  if (existing.length >= store.options.maxRetries) {
    store.budgets.set(url, existing);
    return false;
  }
  existing.push({ timestamp: now });
  store.budgets.set(url, existing);
  return true;
}

export function retryBudgetRemaining(store: RetryBudgetStore, url: string): number {
  const now = Date.now();
  const existing = pruneWindow(store.budgets.get(url) ?? [], store.options.windowMs, now);
  return Math.max(0, store.options.maxRetries - existing.length);
}

export function resetRetryBudget(store: RetryBudgetStore, url: string): void {
  store.budgets.delete(url);
}

export function retryBudgetSummary(store: RetryBudgetStore): Record<string, number> {
  const now = Date.now();
  const summary: Record<string, number> = {};
  for (const [url, entries] of store.budgets.entries()) {
    const active = pruneWindow(entries, store.options.windowMs, now);
    summary[url] = active.length;
  }
  return summary;
}

/**
 * Returns the number of milliseconds until the oldest active retry entry
 * expires for the given URL, giving callers a hint for when budget will free up.
 * Returns 0 if there are no active entries or budget is not exhausted.
 */
export function retryBudgetNextRefreshMs(store: RetryBudgetStore, url: string): number {
  const now = Date.now();
  const existing = pruneWindow(store.budgets.get(url) ?? [], store.options.windowMs, now);
  if (existing.length < store.options.maxRetries || existing.length === 0) {
    return 0;
  }
  const oldest = existing[0].timestamp;
  return Math.max(0, store.options.windowMs - (now - oldest));
}
