import { AlertLevel } from './alerting';

export interface EscalationRule {
  level: AlertLevel;
  afterCount: number;
  notifyChannels: string[];
}

export interface EscalationState {
  counts: Record<string, number>;
  escalated: Record<string, boolean>;
}

export interface EscalationResult {
  escalated: boolean;
  channels: string[];
  count: number;
}

export function createEscalationState(): EscalationState {
  return { counts: {}, escalated: {} };
}

export function recordEscalation(
  state: EscalationState,
  key: string,
  level: AlertLevel,
  rules: EscalationRule[]
): EscalationResult {
  const count = (state.counts[key] = (state.counts[key] ?? 0) + 1);
  const matching = rules
    .filter(r => r.level === level && count >= r.afterCount)
    .sort((a, b) => b.afterCount - a.afterCount);

  if (matching.length === 0) return { escalated: false, channels: [], count };

  const rule = matching[0];
  state.escalated[key] = true;
  return { escalated: true, channels: rule.notifyChannels, count };
}

export function resetEscalation(state: EscalationState, key: string): void {
  delete state.counts[key];
  delete state.escalated[key];
}

export function isEscalated(state: EscalationState, key: string): boolean {
  return state.escalated[key] === true;
}

export function escalationSummary(state: EscalationState): string {
  const keys = Object.keys(state.counts);
  if (keys.length === 0) return 'No escalations tracked.';
  return keys
    .map(k => `${k}: count=${state.counts[k]} escalated=${!!state.escalated[k]}`)
    .join('\n');
}
