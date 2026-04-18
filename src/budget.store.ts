import type { BudgetResult } from './budget';

export interface BudgetStore {
  results: Map<string, BudgetResult>;
  breachCount: number;
}

export function createBudgetStore(): BudgetStore {
  return { results: new Map(), breachCount: 0 };
}

export function recordBudgetResult(store: BudgetStore, result: BudgetResult): void {
  const prev = store.results.get(result.url);
  if (prev && prev.withinBudget && !result.withinBudget) {
    store.breachCount++;
  }
  store.results.set(result.url, result);
}

export function getBreaches(store: BudgetStore): BudgetResult[] {
  return Array.from(store.results.values()).filter(r => !r.withinBudget);
}

export function clearBudgetStore(store: BudgetStore): void {
  store.results.clear();
  store.breachCount = 0;
}

export function budgetStoreSummary(store: BudgetStore): string {
  const total = store.results.size;
  const breaches = getBreaches(store).length;
  return `Budget: ${total - breaches}/${total} within budget, ${store.breachCount} breach event(s)`;
}
