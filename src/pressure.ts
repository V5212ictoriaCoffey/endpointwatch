/**
 * pressure.ts
 * Tracks system load/pressure across endpoints and emits
 * a normalized pressure score (0–1) based on error rate,
 * latency deviation, and circuit state.
 */

export interface PressureInput {
  url: string;
  errorRate: number;       // 0–1
  avgLatency: number;      // ms
  latencyThreshold: number; // ms — "normal" ceiling
  circuitOpen: boolean;
}

export interface PressureResult {
  url: string;
  score: number;           // 0–1, higher = more pressure
  level: 'low' | 'moderate' | 'high' | 'critical';
  reasons: string[];
}

export interface PressureStore {
  history: Map<string, number[]>;
}

export function createPressureStore(): PressureStore {
  return { history: new Map() };
}

export function computePressureScore(input: PressureInput): number {
  const errorComponent = Math.min(input.errorRate, 1);
  const latencyRatio = input.avgLatency / Math.max(input.latencyThreshold, 1);
  const latencyComponent = Math.min(latencyRatio - 1, 1);  // 0 when under threshold
  const circuitComponent = input.circuitOpen ? 1 : 0;

  const raw = errorComponent * 0.4 + Math.max(latencyComponent, 0) * 0.4 + circuitComponent * 0.2;
  return Math.min(Math.max(raw, 0), 1);
}

export function resolveLevel(score: number): PressureResult['level'] {
  if (score >= 0.85) return 'critical';
  if (score >= 0.6)  return 'high';
  if (score >= 0.3)  return 'moderate';
  return 'low';
}

export function evaluatePressure(input: PressureInput): PressureResult {
  const score = computePressureScore(input);
  const level = resolveLevel(score);
  const reasons: string[] = [];

  if (input.circuitOpen) reasons.push('circuit is open');
  if (input.errorRate > 0.1) reasons.push(`error rate ${(input.errorRate * 100).toFixed(1)}%`);
  if (input.avgLatency > input.latencyThreshold) {
    reasons.push(`latency ${input.avgLatency}ms exceeds threshold ${input.latencyThreshold}ms`);
  }

  return { url: input.url, score: parseFloat(score.toFixed(4)), level, reasons };
}

export function recordPressure(store: PressureStore, url: string, score: number, maxHistory = 20): void {
  const existing = store.history.get(url) ?? [];
  existing.push(score);
  if (existing.length > maxHistory) existing.shift();
  store.history.set(url, existing);
}

export function averagePressure(store: PressureStore, url: string): number {
  const entries = store.history.get(url);
  if (!entries || entries.length === 0) return 0;
  return entries.reduce((a, b) => a + b, 0) / entries.length;
}

export function pressureSummary(store: PressureStore): string {
  const lines: string[] = ['Pressure Summary:'];
  for (const [url, scores] of store.history.entries()) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    lines.push(`  ${url}: avg=${avg.toFixed(3)} samples=${scores.length}`);
  }
  return lines.join('\n');
}
