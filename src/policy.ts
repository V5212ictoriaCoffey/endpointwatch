export type PolicyAction = "allow" | "block" | "warn";

export interface PolicyRule {
  id: string;
  urlPattern?: string;
  tags?: string[];
  maxLatency?: number;
  minStatus?: number;
  maxStatus?: number;
  action: PolicyAction;
}

export interface PolicyResult {
  ruleId: string | null;
  action: PolicyAction;
  reason: string;
}

export interface PolicyInput {
  url: string;
  tags?: string[];
  latency: number;
  status: number;
}

export function evaluatePolicy(rules: PolicyRule[], input: PolicyInput): PolicyResult {
  for (const rule of rules) {
    if (rule.urlPattern && !input.url.includes(rule.urlPattern)) continue;
    if (rule.tags && !rule.tags.every(t => (input.tags ?? []).includes(t))) continue;
    if (rule.maxLatency !== undefined && input.latency <= rule.maxLatency) continue;
    if (rule.minStatus !== undefined && input.status < rule.minStatus) continue;
    if (rule.maxStatus !== undefined && input.status > rule.maxStatus) continue;
    return { ruleId: rule.id, action: rule.action, reason: `matched rule ${rule.id}` };
  }
  return { ruleId: null, action: "allow", reason: "no rule matched" };
}

export function evaluateAll(rules: PolicyRule[], inputs: PolicyInput[]): PolicyResult[] {
  return inputs.map(i => evaluatePolicy(rules, i));
}
