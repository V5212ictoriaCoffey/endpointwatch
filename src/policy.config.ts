import type { PolicyRule, PolicyAction } from "./policy";

interface RawRule {
  id?: string;
  urlPattern?: string;
  tags?: string[];
  maxLatency?: number;
  minStatus?: number;
  maxStatus?: number;
  action?: string;
}

const VALID_ACTIONS: PolicyAction[] = ["allow"];

export function parsePolicyRules(raw: unknown): PolicyRule[] {
  if (!Array.isArray(raw)) return [];
  return (raw as RawRule[]).filter(r => r && typeof r === "object").map((r, i) => ({
    id: r.id ?? `rule-${i}`,
    urlPattern: r.urlPattern,
    tags: r.tags,
    maxLatency: r.maxLatency,
    minStatus: r.minStatus,
    maxStatus: r.maxStatus,
    action: VALID_ACTIONS.includes(r.action as PolicyAction) ? (r.action as PolicyAction) : "warn",
  }));
}

export function applyPolicyDefaults(rules: PolicyRule[]): PolicyRule[] {
  return rules.map(r => ({ action: "warn" as PolicyAction, ...r }));
}

export function policySummary(rules: PolicyRule[]): string {
  const counts = { allow: 0, block: 0, warn: 0 };
  for (const r of rules) counts[r.action]++;
  return `policy: ${rules.length} rules (allow=${counts.allow}, warn=${counts.warn}, block=${counts.block})`;
}
