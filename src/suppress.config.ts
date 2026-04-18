import { SuppressRule } from "./suppress";

export interface SuppressConfig {
  rules?: Array<{
    key: string;
    urlPattern?: string;
    alertLevel?: string;
    durationMs?: number;
  }>;
  defaultDurationMs?: number;
}

const DEFAULT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function parseSuppressConfig(raw: unknown): SuppressConfig {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  return {
    rules: Array.isArray(obj.rules) ? obj.rules : [],
    defaultDurationMs:
      typeof obj.defaultDurationMs === "number"
        ? obj.defaultDurationMs
        : DEFAULT_DURATION_MS,
  };
}

export function applySuppressDefaults(cfg: SuppressConfig): Required<SuppressConfig> {
  return {
    rules: cfg.rules ?? [],
    defaultDurationMs: cfg.defaultDurationMs ?? DEFAULT_DURATION_MS,
  };
}

export function toSuppressRules(
  cfg: Required<SuppressConfig>
): Array<{ key: string; rule: SuppressRule }> {
  return (cfg.rules ?? []).map(r => ({
    key: r.key,
    rule: {
      urlPattern: r.urlPattern,
      alertLevel: r.alertLevel,
      durationMs: r.durationMs ?? cfg.defaultDurationMs,
    },
  }));
}

export function suppressConfigSummary(cfg: Required<SuppressConfig>): string {
  return `suppress config: ${cfg.rules?.length ?? 0} rule(s), default duration ${cfg.defaultDurationMs}ms`;
}
