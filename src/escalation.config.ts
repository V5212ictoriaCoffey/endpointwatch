import { EscalationRule } from './escalation';
import { AlertLevel } from './alerting';

export interface EscalationConfig {
  rules: EscalationRule[];
  enabled: boolean;
}

const defaultEscalationConfig: EscalationConfig = {
  rules: [],
  enabled: false,
};

export function parseEscalationConfig(raw: Record<string, unknown>): EscalationConfig {
  if (!raw.escalation || typeof raw.escalation !== 'object') return defaultEscalationConfig;
  const cfg = raw.escalation as Record<string, unknown>;
  const enabled = cfg.enabled !== false;
  const rawRules = Array.isArray(cfg.rules) ? cfg.rules : [];
  const rules: EscalationRule[] = rawRules
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map(r => ({
      level: (r.level as AlertLevel) ?? 'critical',
      afterCount: typeof r.afterCount === 'number' ? r.afterCount : 3,
      notifyChannels: Array.isArray(r.notifyChannels)
        ? (r.notifyChannels as string[])
        : [],
    }));
  return { enabled, rules };
}

export function applyEscalationDefaults(config: Partial<EscalationConfig>): EscalationConfig {
  return {
    enabled: config.enabled ?? false,
    rules: config.rules ?? [],
  };
}

export function escalationConfigSummary(config: EscalationConfig): string {
  if (!config.enabled) return 'Escalation: disabled';
  return `Escalation: ${config.rules.length} rule(s) configured`;
}
