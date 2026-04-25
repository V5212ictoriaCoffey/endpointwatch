import type { AlertLevel } from "./alerting";

export type NotifyChannel = "slack" | "email" | "webhook" | "console";

export interface NotifyRule {
  channel: NotifyChannel;
  minLevel: AlertLevel;
  target?: string; // url, email address, etc.
  enabled: boolean;
}

export interface NotifyEvent {
  url: string;
  level: AlertLevel;
  message: string;
  timestamp: number;
}

export interface NotifyStore {
  rules: NotifyRule[];
  sent: NotifyEvent[];
}

export function createNotifyStore(): NotifyStore {
  return { rules: [], sent: [] };
}

const LEVEL_ORDER: Record<AlertLevel, number> = {
  none: 0,
  warn: 1,
  critical: 2,
};

export function shouldNotifyRule(rule: NotifyRule, level: AlertLevel): boolean {
  if (!rule.enabled) return false;
  return LEVEL_ORDER[level] >= LEVEL_ORDER[rule.minLevel];
}

export function matchingRules(store: NotifyStore, level: AlertLevel): NotifyRule[] {
  return store.rules.filter((r) => shouldNotifyRule(r, level));
}

export function addNotifyRule(store: NotifyStore, rule: NotifyRule): void {
  store.rules.push(rule);
}

export function removeNotifyRule(store: NotifyStore, channel: NotifyChannel, target?: string): void {
  store.rules = store.rules.filter(
    (r) => !(r.channel === channel && r.target === target)
  );
}

export function recordNotifyEvent(store: NotifyStore, event: NotifyEvent): void {
  store.sent.push(event);
}

export function getNotifyHistory(store: NotifyStore, url?: string): NotifyEvent[] {
  if (!url) return [...store.sent];
  return store.sent.filter((e) => e.url === url);
}

export function notifySummary(store: NotifyStore): string {
  const total = store.sent.length;
  const critical = store.sent.filter((e) => e.level === "critical").length;
  const warn = store.sent.filter((e) => e.level === "warn").length;
  return `notify: ${total} sent (${critical} critical, ${warn} warn), ${store.rules.length} rules`;
}
