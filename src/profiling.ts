/**
 * profiling.ts — Per-endpoint request profiling: tracks call counts,
 * total latency, min/max, and computes averages for reporting.
 */

export interface ProfileEntry {
  url: string;
  callCount: number;
  totalLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  errorCount: number;
  lastCalledAt: number;
}

export interface ProfilingStore {
  entries: Map<string, ProfileEntry>;
}

export function createProfilingStore(): ProfilingStore {
  return { entries: new Map() };
}

export function recordProfile(
  store: ProfilingStore,
  url: string,
  latencyMs: number,
  isError: boolean
): ProfileEntry {
  const existing = store.entries.get(url);
  const now = Date.now();

  if (!existing) {
    const entry: ProfileEntry = {
      url,
      callCount: 1,
      totalLatencyMs: latencyMs,
      minLatencyMs: latencyMs,
      maxLatencyMs: latencyMs,
      errorCount: isError ? 1 : 0,
      lastCalledAt: now,
    };
    store.entries.set(url, entry);
    return entry;
  }

  existing.callCount += 1;
  existing.totalLatencyMs += latencyMs;
  existing.minLatencyMs = Math.min(existing.minLatencyMs, latencyMs);
  existing.maxLatencyMs = Math.max(existing.maxLatencyMs, latencyMs);
  existing.errorCount += isError ? 1 : 0;
  existing.lastCalledAt = now;
  return existing;
}

export function getProfile(
  store: ProfilingStore,
  url: string
): ProfileEntry | undefined {
  return store.entries.get(url);
}

export function averageLatency(entry: ProfileEntry): number {
  if (entry.callCount === 0) return 0;
  return entry.totalLatencyMs / entry.callCount;
}

export function errorRate(entry: ProfileEntry): number {
  if (entry.callCount === 0) return 0;
  return entry.errorCount / entry.callCount;
}

export function getAllProfiles(store: ProfilingStore): ProfileEntry[] {
  return Array.from(store.entries.values());
}

export function clearProfile(store: ProfilingStore, url: string): void {
  store.entries.delete(url);
}

export function clearAllProfiles(store: ProfilingStore): void {
  store.entries.clear();
}
