/**
 * audit.ts
 * Tracks and stores audit log entries for monitoring events such as
 * config changes, alert triggers, incident openings, and scheduler actions.
 */

export type AuditEventType =
  | "config_loaded"
  | "endpoint_added"
  | "endpoint_removed"
  | "alert_triggered"
  | "incident_opened"
  | "incident_resolved"
  | "maintenance_started"
  | "maintenance_ended"
  | "scheduler_started"
  | "scheduler_stopped"
  | "probe_executed"
  | "policy_violated"
  | "sla_breached"
  | "budget_breached"
  | "custom";

export interface AuditEntry {
  id: string;
  timestamp: number;
  event: AuditEventType;
  url?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface AuditStore {
  entries: AuditEntry[];
  maxSize: number;
}

let _counter = 0;
function generateAuditId(): string {
  return `audit-${Date.now()}-${++_counter}`;
}

/** Create a new audit store with an optional maximum entry limit. */
export function createAuditStore(maxSize = 1000): AuditStore {
  return { entries: [], maxSize };
}

/** Append a new audit entry to the store, evicting oldest if over capacity. */
export function addAuditEntry(
  store: AuditStore,
  event: AuditEventType,
  message: string,
  url?: string,
  metadata?: Record<string, unknown>
): AuditEntry {
  const entry: AuditEntry = {
    id: generateAuditId(),
    timestamp: Date.now(),
    event,
    message,
    url,
    metadata,
  };
  store.entries.push(entry);
  if (store.entries.length > store.maxSize) {
    store.entries.shift();
  }
  return entry;
}

/** Retrieve all entries, optionally filtered by event type. */
export function getAuditEntries(
  store: AuditStore,
  event?: AuditEventType
): AuditEntry[] {
  if (!event) return [...store.entries];
  return store.entries.filter((e) => e.event === event);
}

/** Retrieve entries for a specific URL. */
export function getAuditEntriesByUrl(
  store: AuditStore,
  url: string
): AuditEntry[] {
  return store.entries.filter((e) => e.url === url);
}

/** Clear all entries from the store. */
export function clearAuditStore(store: AuditStore): void {
  store.entries = [];
}

/** Format a single audit entry as a human-readable string. */
export function formatAuditEntry(entry: AuditEntry): string {
  const ts = new Date(entry.timestamp).toISOString();
  const url = entry.url ? ` [${entry.url}]` : "";
  return `${ts} [${entry.event}]${url} ${entry.message}`;
}

/** Format all entries in the store as a multiline string. */
export function formatAuditLog(store: AuditStore): string {
  if (store.entries.length === 0) return "(no audit entries)";
  return store.entries.map(formatAuditEntry).join("\n");
}

/** Return a summary of event type counts. */
export function auditSummary(
  store: AuditStore
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of store.entries) {
    counts[entry.event] = (counts[entry.event] ?? 0) + 1;
  }
  return counts;
}
