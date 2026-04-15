/**
 * Deduplication module: suppresses repeated alerts for the same endpoint
 * within a configurable cooldown window.
 */

export interface DedupStore {
  lastAlertedAt: Map<string, number>;
}

export interface DedupOptions {
  /** Cooldown period in milliseconds before the same alert fires again */
  cooldownMs: number;
}

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export function createDedupStore(): DedupStore {
  return { lastAlertedAt: new Map() };
}

export function parseDedupOptions(
  raw: Partial<DedupOptions> | undefined
): DedupOptions {
  return {
    cooldownMs:
      raw?.cooldownMs !== undefined && raw.cooldownMs >= 0
        ? raw.cooldownMs
        : DEFAULT_COOLDOWN_MS,
  };
}

/**
 * Returns true if the alert for the given key should be suppressed
 * (i.e. it was already fired within the cooldown window).
 */
export function isSuppressed(
  store: DedupStore,
  key: string,
  options: DedupOptions,
  now: number = Date.now()
): boolean {
  const last = store.lastAlertedAt.get(key);
  if (last === undefined) return false;
  return now - last < options.cooldownMs;
}

/**
 * Records that an alert was fired for the given key at `now`.
 */
export function recordAlert(
  store: DedupStore,
  key: string,
  now: number = Date.now()
): void {
  store.lastAlertedAt.set(key, now);
}

/**
 * Clears the dedup record for a key (e.g. when an endpoint recovers).
 */
export function clearAlert(store: DedupStore, key: string): void {
  store.lastAlertedAt.delete(key);
}

/**
 * Returns a dedup key for an endpoint + alert level combination.
 */
export function dedupKey(url: string, alertLevel: string): string {
  return `${url}::${alertLevel}`;
}
