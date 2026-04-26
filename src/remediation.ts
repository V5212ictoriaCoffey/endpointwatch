/**
 * remediation.ts
 *
 * Defines automated remediation actions that can be triggered when an endpoint
 * enters a degraded or failing state. Supports action types such as webhook
 * callbacks, script execution markers, and notification dispatches. Each
 * action is associated with a trigger condition (alert level or status code
 * range) and tracks execution history to prevent runaway loops.
 */

export type RemediationTrigger = "critical" | "warning" | "error" | "timeout";

export type RemediationActionType = "webhook" | "notify" | "restart" | "log";

export interface RemediationAction {
  id: string;
  url: string;
  trigger: RemediationTrigger;
  type: RemediationActionType;
  /** Payload template — supports {{url}}, {{status}}, {{latency}} */
  payloadTemplate?: string;
  /** Max times this action fires per cooldown window */
  maxFires: number;
  /** Cooldown window in milliseconds */
  cooldownMs: number;
}

export interface RemediationRecord {
  actionId: string;
  url: string;
  trigger: RemediationTrigger;
  firedAt: number;
  success: boolean;
  note?: string;
}

export interface RemediationStore {
  actions: RemediationAction[];
  history: RemediationRecord[];
}

export function createRemediationStore(): RemediationStore {
  return { actions: [], history: [] };
}

export function addAction(
  store: RemediationStore,
  action: RemediationAction
): void {
  store.actions.push(action);
}

export function removeAction(store: RemediationStore, id: string): boolean {
  const before = store.actions.length;
  store.actions = store.actions.filter((a) => a.id !== id);
  return store.actions.length < before;
}

/** Returns how many times an action has fired for a given endpoint URL within its cooldown window. */
export function fireCount(
  store: RemediationStore,
  actionId: string,
  url: string,
  now: number,
  cooldownMs: number
): number {
  return store.history.filter(
    (r) =>
      r.actionId === actionId &&
      r.url === url &&
      now - r.firedAt < cooldownMs
  ).length;
}

/** Determines whether an action is eligible to fire given its cooldown and maxFires limits. */
export function canFire(
  store: RemediationStore,
  action: RemediationAction,
  url: string,
  now: number
): boolean {
  const count = fireCount(store, action.id, url, now, action.cooldownMs);
  return count < action.maxFires;
}

/** Resolves the payload string by substituting template variables. */
export function resolvePayload(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{{${key}}}`
  );
}

/** Records that an action fired (or failed) for a given URL. */
export function recordRemediation(
  store: RemediationStore,
  record: RemediationRecord
): void {
  store.history.push(record);
}

/** Returns all actions matching a given trigger for a specific URL. */
export function getEligibleActions(
  store: RemediationStore,
  trigger: RemediationTrigger,
  url: string,
  now: number = Date.now()
): RemediationAction[] {
  return store.actions.filter(
    (a) => a.trigger === trigger && canFire(store, a, url, now)
  );
}

/** Prunes history records older than the maximum cooldown across all actions. */
export function pruneHistory(
  store: RemediationStore,
  now: number = Date.now()
): void {
  const maxCooldown = store.actions.reduce(
    (max, a) => Math.max(max, a.cooldownMs),
    0
  );
  store.history = store.history.filter((r) => now - r.firedAt < maxCooldown);
}

/** Summarises the remediation store for diagnostic output. */
export function remediationSummary(store: RemediationStore): string {
  return (
    `Remediation: ${store.actions.length} action(s) registered, ` +
    `${store.history.length} historical record(s)`
  );
}
