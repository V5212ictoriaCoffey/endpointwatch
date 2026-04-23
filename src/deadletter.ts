/**
 * Dead-letter store for failed webhook / notification deliveries.
 * Entries are kept for manual inspection or re-delivery.
 */

export interface DeadLetterEntry {
  id: string;
  url: string;
  payload: unknown;
  reason: string;
  attempts: number;
  firstFailedAt: number;
  lastFailedAt: number;
}

export interface DeadLetterStore {
  entries: Map<string, DeadLetterEntry>;
}

let _counter = 0;
function generateId(): string {
  return `dl-${Date.now()}-${++_counter}`;
}

export function createDeadLetterStore(): DeadLetterStore {
  return { entries: new Map() };
}

export function addDeadLetter(
  store: DeadLetterStore,
  url: string,
  payload: unknown,
  reason: string,
  existingId?: string
): DeadLetterEntry {
  const id = existingId ?? generateId();
  const now = Date.now();
  const existing = store.entries.get(id);

  const entry: DeadLetterEntry = {
    id,
    url,
    payload,
    reason,
    attempts: (existing?.attempts ?? 0) + 1,
    firstFailedAt: existing?.firstFailedAt ?? now,
    lastFailedAt: now,
  };

  store.entries.set(id, entry);
  return entry;
}

export function removeDeadLetter(store: DeadLetterStore, id: string): boolean {
  return store.entries.delete(id);
}

export function getDeadLetters(store: DeadLetterStore): DeadLetterEntry[] {
  return Array.from(store.entries.values()).sort(
    (a, b) => b.lastFailedAt - a.lastFailedAt
  );
}

export function clearDeadLetters(store: DeadLetterStore): void {
  store.entries.clear();
}

export function deadLetterSummary(store: DeadLetterStore): string {
  const total = store.entries.size;
  if (total === 0) return "dead-letter: empty";
  const maxAttempts = Math.max(...Array.from(store.entries.values()).map(e => e.attempts));
  return `dead-letter: ${total} entr${total === 1 ? 'y' : 'ies'}, max attempts: ${maxAttempts}`;
}
