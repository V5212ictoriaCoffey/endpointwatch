/**
 * runbook.ts — Associates runbook URLs or instructions with endpoints/alert levels
 * for operator guidance during incidents.
 */

export type AlertLevel = 'critical' | 'warning' | 'info';

export interface RunbookEntry {
  url?: string;
  steps?: string[];
  alertLevel?: AlertLevel;
  endpointPattern?: string;
}

export interface RunbookStore {
  entries: RunbookEntry[];
}

export function createRunbookStore(): RunbookStore {
  return { entries: [] };
}

export function addRunbook(store: RunbookStore, entry: RunbookEntry): void {
  store.entries.push(entry);
}

export function removeRunbook(store: RunbookStore, url: string): boolean {
  const before = store.entries.length;
  store.entries = store.entries.filter((e) => e.url !== url);
  return store.entries.length < before;
}

export function findRunbook(
  store: RunbookStore,
  endpointUrl: string,
  alertLevel?: AlertLevel
): RunbookEntry | undefined {
  return store.entries.find((entry) => {
    const levelMatch =
      !entry.alertLevel || !alertLevel || entry.alertLevel === alertLevel;
    const patternMatch =
      !entry.endpointPattern ||
      new RegExp(entry.endpointPattern).test(endpointUrl);
    return levelMatch && patternMatch;
  });
}

export function formatRunbook(entry: RunbookEntry): string {
  const parts: string[] = [];
  if (entry.url) parts.push(`Runbook: ${entry.url}`);
  if (entry.steps && entry.steps.length > 0) {
    parts.push('Steps:');
    entry.steps.forEach((step, i) => parts.push(`  ${i + 1}. ${step}`));
  }
  return parts.length > 0 ? parts.join('\n') : '(no runbook details)';
}

export function runbookSummary(store: RunbookStore): string {
  if (store.entries.length === 0) return 'No runbooks configured.';
  return store.entries
    .map(
      (e) =>
        `[${e.alertLevel ?? 'any'}] ${e.endpointPattern ?? '*'} => ${
          e.url ?? '(inline steps)'
        }`
    )
    .join('\n');
}
