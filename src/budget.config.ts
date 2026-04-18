import type { BudgetOptions } from './budget';

export interface RawBudgetConfig {
  maxLatencyMs?: unknown;
  maxErrorRate?: unknown;
  maxP95Ms?: unknown;
}

export const defaultBudgetOptions: BudgetOptions = {
  maxLatencyMs: 2000,
  maxErrorRate: 0.05,
};

export function parseBudgetConfig(raw: RawBudgetConfig): BudgetOptions {
  const opts: BudgetOptions = { ...defaultBudgetOptions };
  if (typeof raw.maxLatencyMs === 'number') opts.maxLatencyMs = raw.maxLatencyMs;
  if (typeof raw.maxErrorRate === 'number') opts.maxErrorRate = Math.min(1, Math.max(0, raw.maxErrorRate));
  if (typeof raw.maxP95Ms === 'number') opts.maxP95Ms = raw.maxP95Ms;
  return opts;
}

export function applyBudgetDefaults(raw: Partial<BudgetOptions>): BudgetOptions {
  return { ...defaultBudgetOptions, ...raw };
}

export function budgetSummary(opts: BudgetOptions): string {
  const parts = [
    `maxLatency=${opts.maxLatencyMs}ms`,
    `maxErrorRate=${(opts.maxErrorRate * 100).toFixed(1)}%`,
  ];
  if (opts.maxP95Ms != null) parts.push(`maxP95=${opts.maxP95Ms}ms`);
  return `Budget(${parts.join(', ')})`;
}
