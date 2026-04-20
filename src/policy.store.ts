import type { PolicyRule, PolicyResult, PolicyInput } from "./policy";
import { evaluatePolicy } from "./policy";

export interface PolicyStore {
  rules: PolicyRule[];
  violations: Array<{ input: PolicyInput; result: PolicyResult; ts: number }>;
}

export function createPolicyStore(rules: PolicyRule[] = []): PolicyStore {
  return { rules, violations: [] };
}

export function addRule(store: PolicyStore, rule: PolicyRule): void {
  store.rules.push(rule);
}

export function removeRule(store: PolicyStore, id: string): void {
  store.rules = store.rules.filter(r => r.id !== id);
}

export function check(store: PolicyStore, input: PolicyInput): PolicyResult {
  const result = evaluatePolicy(store.rules, input);
  if (result.action !== "allow") {
    store.violations.push({ input, result, ts: Date.now() });
  }
  return result;
}

export function getViolations(store: PolicyStore) {
  return store.violations;
}

export function clearViolations(store: PolicyStore): void {
  store.violations = [];
}

export function policyStoreSummary(store: PolicyStore): string {
  return `policy store: ${store.rules.length} rules, ${store.violations.length} violations`;
}
