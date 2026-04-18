export interface OncallEntry {
  id: string;
  name: string;
  email: string;
  startTime: number;
  endTime: number;
}

export interface OncallStore {
  entries: OncallEntry[];
}

export function createOncallStore(): OncallStore {
  return { entries: [] };
}

export function addOncallEntry(store: OncallStore, entry: OncallEntry): void {
  store.entries.push(entry);
}

export function removeOncallEntry(store: OncallStore, id: string): void {
  store.entries = store.entries.filter(e => e.id !== id);
}

export function getCurrentOncall(store: OncallStore, now = Date.now()): OncallEntry | undefined {
  return store.entries.find(e => e.startTime <= now && e.endTime > now);
}

export function getUpcomingOncall(store: OncallStore, now = Date.now()): OncallEntry[] {
  return store.entries.filter(e => e.startTime > now).sort((a, b) => a.startTime - b.startTime);
}

export function oncallSummary(store: OncallStore, now = Date.now()): string {
  const current = getCurrentOncall(store, now);
  const upcoming = getUpcomingOncall(store, now);
  const lines: string[] = [];
  if (current) {
    lines.push(`oncall: ${current.name} <${current.email}> (until ${new Date(current.endTime).toISOString()})`);
  } else {
    lines.push('oncall: none scheduled');
  }
  if (upcoming.length > 0) {
    lines.push(`next: ${upcoming[0].name} from ${new Date(upcoming[0].startTime).toISOString()}`);
  }
  return lines.join('\n');
}
