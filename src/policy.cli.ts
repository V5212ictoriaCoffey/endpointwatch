import { parsePolicyRules, policySummary } from "./policy.config";
import { createPolicyStore, check, getViolations, policyStoreSummary } from "./policy.store";
import type { PolicyInput } from "./policy";

export interface PolicyCLIOptions {
  rules: unknown;
  inputs: PolicyInput[];
  verbose?: boolean;
}

export function runPolicyCLI(opts: PolicyCLIOptions): void {
  const rules = parsePolicyRules(opts.rules);
  const store = createPolicyStore(rules);

  if (opts.verbose) {
    console.log(policySummary(rules));
  }

  for (const input of opts.inputs) {
    const result = check(store, input);
    if (result.action === "block") {
      console.error(`[BLOCK] ${input.url} — ${result.reason}`);
    } else if (result.action === "warn") {
      console.warn(`[WARN]  ${input.url} — ${result.reason}`);
    } else if (opts.verbose) {
      console.log(`[ALLOW] ${input.url}`);
    }
  }

  const violations = getViolations(store);
  if (violations.length > 0) {
    console.log(`\n${policyStoreSummary(store)}`);
  }
}
