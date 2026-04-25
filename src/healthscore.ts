/**
 * healthscore.ts
 * Computes a composite health score (0–100) for an endpoint based on
 * error rate, average latency, and SLA / budget breach signals.
 */

export interface HealthScoreInput {
  errorRate: number;       // 0..1
  avgLatency: number;      // ms
  latencyBudget: number;   // ms — target ceiling
  slaTarget: number;       // 0..1 uptime target (e.g. 0.99)
  slaCurrent: number;      // 0..1 current uptime
  flapping?: boolean;
}

export interface HealthScoreResult {
  url: string;
  score: number;           // 0–100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: {
    availability: number;  // 0–100
    latency: number;       // 0–100
    sla: number;           // 0–100
    stability: number;     // 0–100
  };
  timestamp: number;
}

const WEIGHTS = {
  availability: 0.4,
  latency: 0.3,
  sla: 0.2,
  stability: 0.1,
};

export function computeHealthScore(
  url: string,
  input: HealthScoreInput
): HealthScoreResult {
  const availability = Math.max(0, (1 - input.errorRate) * 100);

  const latencyRatio = input.latencyBudget > 0
    ? input.avgLatency / input.latencyBudget
    : 1;
  const latency = Math.max(0, Math.min(100, (1 - Math.min(latencyRatio, 1)) * 100));

  const slaGap = input.slaCurrent - input.slaTarget;
  const sla = slaGap >= 0
    ? 100
    : Math.max(0, 100 + slaGap * 1000);

  const stability = input.flapping ? 0 : 100;

  const score = Math.round(
    availability * WEIGHTS.availability +
    latency     * WEIGHTS.latency +
    sla         * WEIGHTS.sla +
    stability   * WEIGHTS.stability
  );

  return {
    url,
    score,
    grade: gradeFromScore(score),
    factors: {
      availability: Math.round(availability),
      latency: Math.round(latency),
      sla: Math.round(sla),
      stability: Math.round(stability),
    },
    timestamp: Date.now(),
  };
}

export function gradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function computeAllHealthScores(
  entries: Array<{ url: string; input: HealthScoreInput }>
): HealthScoreResult[] {
  return entries.map(({ url, input }) => computeHealthScore(url, input));
}

export function formatHealthScore(result: HealthScoreResult): string {
  const { url, score, grade, factors } = result;
  return [
    `[${grade}] ${url}  score=${score}/100`,
    `  availability=${factors.availability}  latency=${factors.latency}  sla=${factors.sla}  stability=${factors.stability}`,
  ].join('\n');
}
