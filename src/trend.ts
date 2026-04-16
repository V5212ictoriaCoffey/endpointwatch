export interface TrendResult {
  direction: 'improving' | 'degrading' | 'stable';
  changePercent: number;
  windowSize: number;
}

export interface TrendOptions {
  windowSize?: number;
  degradeThreshold?: number;
  improveThreshold?: number;
}

const defaults: Required<TrendOptions> = {
  windowSize: 10,
  degradeThreshold: 10,
  improveThreshold: 10,
};

export function analyzeTrend(
  latencies: number[],
  options: TrendOptions = {}
): TrendResult {
  const opts = { ...defaults, ...options };
  const window = latencies.slice(-opts.windowSize);

  if (window.length < 2) {
    return { direction: 'stable', changePercent: 0, windowSize: window.length };
  }

  const half = Math.floor(window.length / 2);
  const firstHalf = window.slice(0, half);
  const secondHalf = window.slice(half);

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const before = avg(firstHalf);
  const after = avg(secondHalf);

  if (before === 0) {
    return { direction: 'stable', changePercent: 0, windowSize: window.length };
  }

  const changePercent = ((after - before) / before) * 100;

  let direction: TrendResult['direction'] = 'stable';
  if (changePercent > opts.degradeThreshold) direction = 'degrading';
  else if (changePercent < -opts.improveThreshold) direction = 'improving';

  return { direction, changePercent: Math.round(changePercent * 100) / 100, windowSize: window.length };
}

export function trendSummary(result: TrendResult): string {
  const sign = result.changePercent >= 0 ? '+' : '';
  return `trend=${result.direction} change=${sign}${result.changePercent}% window=${result.windowSize}`;
}
