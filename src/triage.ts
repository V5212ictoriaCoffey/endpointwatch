/**
 * triage.ts — Prioritize and rank active incidents/alerts by severity and age.
 */

export type TriagePriority = "critical" | "high" | "medium" | "low";

export interface TriageItem {
  id: string;
  url: string;
  alertLevel: string;
  openedAt: number;
  failureCount: number;
  tags?: string[];
}

export interface TriageResult {
  item: TriageItem;
  priority: TriagePriority;
  score: number;
  ageMs: number;
}

const LEVEL_WEIGHT: Record<string, number> = {
  critical: 100,
  high: 60,
  medium: 30,
  low: 10,
};

const AGE_WEIGHT_PER_MINUTE = 0.5;
const FAILURE_WEIGHT = 5;

export function scoreItem(item: TriageItem, now = Date.now()): number {
  const ageMs = now - item.openedAt;
  const ageMinutes = ageMs / 60_000;
  const levelScore = LEVEL_WEIGHT[item.alertLevel] ?? 10;
  return levelScore + ageMinutes * AGE_WEIGHT_PER_MINUTE + item.failureCount * FAILURE_WEIGHT;
}

export function resolvePriority(score: number): TriagePriority {
  if (score >= 120) return "critical";
  if (score >= 70) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export function triageItems(items: TriageItem[], now = Date.now()): TriageResult[] {
  return items
    .map((item) => {
      const ageMs = now - item.openedAt;
      const score = scoreItem(item, now);
      const priority = resolvePriority(score);
      return { item, priority, score, ageMs };
    })
    .sort((a, b) => b.score - a.score);
}

export function formatTriage(results: TriageResult[]): string {
  if (results.length === 0) return "No active triage items.";
  return results
    .map((r, i) => {
      const age = Math.round(r.ageMs / 60_000);
      return `${i + 1}. [${r.priority.toUpperCase()}] ${r.item.url} — score=${r.score.toFixed(1)}, age=${age}m, failures=${r.item.failureCount}`;
    })
    .join("\n");
}
