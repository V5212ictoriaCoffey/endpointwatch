export interface BudgetOptions {
  maxLatencyMs: number;
  maxErrorRate: number; // 0-1
  maxP95Ms?: number;
}

export interface BudgetResult {
  url: string;
  latencyOk: boolean;
  errorRateOk: boolean;
  p95Ok: boolean;
  withinBudget: boolean;
  violations: string[];
}

export function checkBudget(
  url: string,
  avgLatency: number,
  errorRate: number,
  p95: number | null,
  opts: BudgetOptions
): BudgetResult {
  const violations: string[] = [];

  const latencyOk = avgLatency <= opts.maxLatencyMs;
  if (!latencyOk) violations.push(`avg latency ${avgLatency}ms > ${opts.maxLatencyMs}ms`);

  const errorRateOk = errorRate <= opts.maxErrorRate;
  if (!errorRateOk) violations.push(`error rate ${(errorRate * 100).toFixed(1)}% > ${(opts.maxErrorRate * 100).toFixed(1)}%`);

  let p95Ok = true;
  if (opts.maxP95Ms != null && p95 != null) {
    p95Ok = p95 <= opts.maxP95Ms;
    if (!p95Ok) violations.push(`p95 ${p95}ms > ${opts.maxP95Ms}ms`);
  }

  return { url, latencyOk, errorRateOk, p95Ok, withinBudget: violations.length === 0, violations };
}

export function checkAllBudgets(
  entries: Array<{ url: string; avgLatency: number; errorRate: number; p95: number | null }>,
  opts: BudgetOptions
): BudgetResult[] {
  return entries.map(e => checkBudget(e.url, e.avgLatency, e.errorRate, e.p95, opts));
}

export function formatBudgetResult(r: BudgetResult): string {
  if (r.withinBudget) return `[OK] ${r.url} is within budget`;
  return `[BREACH] ${r.url}: ${r.violations.join('; ')}`;
}
