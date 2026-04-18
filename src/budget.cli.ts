import { parseBudgetConfig, budgetSummary } from './budget.config';
import { checkAllBudgets, formatBudgetResult } from './budget';
import { createBudgetStore, recordBudgetResult, getBreaches } from './budget.store';

export interface BudgetCLIInput {
  url: string;
  avgLatency: number;
  errorRate: number;
  p95: number | null;
}

export interface BudgetCLIOptions {
  maxLatencyMs?: number;
  maxErrorRate?: number;
  maxP95Ms?: number;
  quiet?: boolean;
}

export function runBudgetCLI(
  inputs: BudgetCLIInput[],
  rawOpts: BudgetCLIOptions,
  log: (msg: string) => void = console.log
): { passed: boolean; breachCount: number } {
  const opts = parseBudgetConfig(rawOpts);
  const store = createBudgetStore();

  if (!rawOpts.quiet) {
    log(budgetSummary(opts));
  }

  const results = checkAllBudgets(inputs, opts);
  for (const r of results) {
    recordBudgetResult(store, r);
    if (!rawOpts.quiet) log(formatBudgetResult(r));
  }

  const breaches = getBreaches(store);
  if (breaches.length > 0 && !rawOpts.quiet) {
    log(`\n${breaches.length} endpoint(s) breached budget.`);
  }

  return { passed: breaches.length === 0, breachCount: breaches.length };
}
