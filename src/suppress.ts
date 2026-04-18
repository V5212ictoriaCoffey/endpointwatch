export interface SuppressRule {
  urlPattern?: string;
  alertLevel?: string;
  durationMs: number;
}

export interface SuppressStore {
  rules: Map<string, { rule: SuppressRule; expiresAt: number }>;
}

export function createSuppressStore(): SuppressStore {
  return { rules: new Map() };
}

export function addSuppressRule(
  store: SuppressStore,
  key: string,
  rule: SuppressRule,
  now = Date.now()
): void {
  store.rules.set(key, { rule, expiresAt: now + rule.durationMs });
}

export function removeSuppressRule(store: SuppressStore, key: string): void {
  store.rules.delete(key);
}

export function isSuppressed(
  store: SuppressStore,
  url: string,
  alertLevel: string,
  now = Date.now()
): boolean {
  for (const [, entry] of store.rules) {
    if (entry.expiresAt < now) continue;
    const { rule } = entry;
    const urlMatch = !rule.urlPattern || url.includes(rule.urlPattern);
    const levelMatch = !rule.alertLevel || rule.alertLevel === alertLevel;
    if (urlMatch && levelMatch) return true;
  }
  return false;
}

export function pruneExpired(store: SuppressStore, now = Date.now()): number {
  let count = 0;
  for (const [key, entry] of store.rules) {
    if (entry.expiresAt < now) {
      store.rules.delete(key);
      count++;
    }
  }
  return count;
}

export function suppressSummary(store: SuppressStore, now = Date.now()): string {
  const active = [...store.rules.values()].filter(e => e.expiresAt >= now);
  return `suppress: ${active.length} active rule(s)`;
}
