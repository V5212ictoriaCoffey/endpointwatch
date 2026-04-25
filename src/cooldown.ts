/**
 * cooldown.ts — Per-endpoint cooldown tracking to prevent alert storms.
 * After an alert fires, the endpoint enters a cooldown period during which
 * further alerts are suppressed.
 */

export interface CooldownOptions {
  durationMs: number;
}

export interface CooldownEntry {
  url: string;
  expiresAt: number;
}

export interface CooldownStore {
  entries: Map<string, CooldownEntry>;
  options: CooldownOptions;
}

export function createCooldownStore(options: CooldownOptions): CooldownStore {
  return { entries: new Map(), options };
}

export function enterCooldown(store: CooldownStore, url: string, now = Date.now()): void {
  store.entries.set(url, {
    url,
    expiresAt: now + store.options.durationMs,
  });
}

export function isInCooldown(store: CooldownStore, url: string, now = Date.now()): boolean {
  const entry = store.entries.get(url);
  if (!entry) return false;
  if (now >= entry.expiresAt) {
    store.entries.delete(url);
    return false;
  }
  return true;
}

export function clearCooldown(store: CooldownStore, url: string): void {
  store.entries.delete(url);
}

export function clearAllCooldowns(store: CooldownStore): void {
  store.entries.clear();
}

export function cooldownRemaining(store: CooldownStore, url: string, now = Date.now()): number {
  const entry = store.entries.get(url);
  if (!entry) return 0;
  const remaining = entry.expiresAt - now;
  return remaining > 0 ? remaining : 0;
}

export function cooldownSummary(store: CooldownStore): string {
  const active = [...store.entries.values()].filter(
    (e) => e.expiresAt > Date.now()
  );
  return `cooldown: ${active.length} active (durationMs=${store.options.durationMs})`;
}
