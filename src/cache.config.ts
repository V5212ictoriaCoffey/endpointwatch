/**
 * Cache configuration parsing and defaults.
 */

export interface CacheConfig {
  enabled: boolean;
  ttlMs: number;
}

const DEFAULT_TTL_MS = 5000;

export function parseCacheConfig(raw: Record<string, unknown> | undefined): CacheConfig {
  if (!raw || raw.enabled === false) {
    return { enabled: false, ttlMs: DEFAULT_TTL_MS };
  }

  const enabled = raw.enabled !== false;
  let ttlMs = DEFAULT_TTL_MS;

  if (typeof raw.ttlMs === 'number' && raw.ttlMs > 0) {
    ttlMs = raw.ttlMs;
  } else if (typeof raw.ttlMs === 'string') {
    const parsed = parseInt(raw.ttlMs, 10);
    if (!isNaN(parsed) && parsed > 0) ttlMs = parsed;
  }

  return { enabled, ttlMs };
}

export function applyCacheDefaults(partial: Partial<CacheConfig>): CacheConfig {
  return {
    enabled: partial.enabled ?? false,
    ttlMs: partial.ttlMs ?? DEFAULT_TTL_MS,
  };
}

export function cacheSummary(config: CacheConfig): string {
  if (!config.enabled) return 'cache: disabled';
  return `cache: enabled (ttl=${config.ttlMs}ms)`;
}
