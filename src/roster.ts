/**
 * roster.ts — Manages a rotating list of alert recipients per endpoint or group.
 */

export interface RosterEntry {
  id: string;
  name: string;
  contact: string;
  tags: string[];
  active: boolean;
}

export interface RosterStore {
  entries: Map<string, RosterEntry>;
}

export function createRosterStore(): RosterStore {
  return { entries: new Map() };
}

export function addRosterEntry(store: RosterStore, entry: RosterEntry): void {
  store.entries.set(entry.id, { ...entry });
}

export function removeRosterEntry(store: RosterStore, id: string): boolean {
  return store.entries.delete(id);
}

export function getRosterEntry(store: RosterStore, id: string): RosterEntry | undefined {
  return store.entries.get(id);
}

export function getActiveRecipients(store: RosterStore, tags: string[] = []): RosterEntry[] {
  const all = Array.from(store.entries.values()).filter((e) => e.active);
  if (tags.length === 0) return all;
  return all.filter((e) => tags.some((t) => e.tags.includes(t)));
}

export function rotateRoster(store: RosterStore, tags: string[] = []): RosterEntry | undefined {
  const active = getActiveRecipients(store, tags);
  if (active.length === 0) return undefined;
  // Round-robin: pick based on current minute
  const index = Math.floor(Date.now() / 60_000) % active.length;
  return active[index];
}

export function rosterSummary(store: RosterStore): string {
  const total = store.entries.size;
  const active = Array.from(store.entries.values()).filter((e) => e.active).length;
  return `roster: ${active} active / ${total} total recipients`;
}
