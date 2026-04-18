import { describe, it, expect } from 'vitest';
import { checkBudget, checkAllBudgets, formatBudgetResult } from './budget';
import { parseBudgetConfig, budgetSummary, defaultBudgetOptions } from './budget.config';
import { createBudgetStore, recordBudgetResult, getBreaches, budgetStoreSummary } from './budget.store';

const opts = { maxLatencyMs: 500, maxErrorRate: 0.1, maxP95Ms: 800 };

describe('checkBudget', () => {
  it('passes when all metrics within budget', () => {
    const r = checkBudget('http://a.com', 300, 0.05, 600, opts);
    expect(r.withinBudget).toBe(true);
    expect(r.violations).toHaveLength(0);
  });

  it('fails on latency breach', () => {
    const r = checkBudget('http://a.com', 600, 0.05, 600, opts);
    expect(r.latencyOk).toBe(false);
    expect(r.violations.length).toBeGreaterThan(0);
  });

  it('fails on error rate breach', () => {
    const r = checkBudget('http://a.com', 300, 0.2, 600, opts);
    expect(r.errorRateOk).toBe(false);
  });

  it('fails on p95 breach', () => {
    const r = checkBudget('http://a.com', 300, 0.05, 900, opts);
    expect(r.p95Ok).toBe(false);
  });

  it('skips p95 check when null', () => {
    const r = checkBudget('http://a.com', 300, 0.05, null, opts);
    expect(r.p95Ok).toBe(true);
  });
});

describe('checkAllBudgets', () => {
  it('returns results for each entry', () => {
    const entries = [
      { url: 'http://a.com', avgLatency: 100, errorRate: 0, p95: 200 },
      { url: 'http://b.com', avgLatency: 999, errorRate: 0.5, p95: 1200 },
    ];
    const results = checkAllBudgets(entries, opts);
    expect(results[0].withinBudget).toBe(true);
    expect(results[1].withinBudget).toBe(false);
  });
});

describe('formatBudgetResult', () => {
  it('formats ok result', () => {
    const r = checkBudget('http://a.com', 100, 0, 200, opts);
    expect(formatBudgetResult(r)).toContain('[OK]');
  });

  it('formats breach result', () => {
    const r = checkBudget('http://a.com', 999, 0.9, 2000, opts);
    expect(formatBudgetResult(r)).toContain('[BREACH]');
  });
});

describe('parseBudgetConfig', () => {
  it('applies defaults for empty config', () => {
    const c = parseBudgetConfig({});
    expect(c.maxLatencyMs).toBe(defaultBudgetOptions.maxLatencyMs);
  });

  it('clamps errorRate to [0,1]', () => {
    const c = parseBudgetConfig({ maxErrorRate: 5 });
    expect(c.maxErrorRate).toBe(1);
  });
});

describe('budgetSummary', () => {
  it('includes p95 when set', () => {
    expect(budgetSummary(opts)).toContain('maxP95');
  });
});

describe('BudgetStore', () => {
  it('tracks breaches', () => {
    const store = createBudgetStore();
    const ok = checkBudget('http://a.com', 100, 0, 200, opts);
    const bad = checkBudget('http://a.com', 999, 0.9, 2000, opts);
    recordBudgetResult(store, ok);
    recordBudgetResult(store, bad);
    expect(store.breachCount).toBe(1);
    expect(getBreaches(store)).toHaveLength(1);
    expect(budgetStoreSummary(store)).toContain('1 breach');
  });
});
