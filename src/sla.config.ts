import type { SlaTarget } from "./sla";

export interface SlaConfig {
  targets: SlaTarget[];
  defaultUptimePercent: number;
  defaultMaxLatencyMs: number;
}

const defaults: Omit<SlaConfig, "targets"> = {
  defaultUptimePercent: 99.9,
  defaultMaxLatencyMs: 1000,
};

export function parseSlaConfig(raw: Record<string, unknown>): SlaConfig {
  const targets: SlaTarget[] = [];
  if (Array.isArray(raw.slaTargets)) {
    for (const t of raw.slaTargets) {
      if (typeof t.url === "string") {
        targets.push({
          url: t.url,
          uptimePercent:
            typeof t.uptimePercent === "number"
              ? t.uptimePercent
              : defaults.defaultUptimePercent,
          maxLatencyMs:
            typeof t.maxLatencyMs === "number"
              ? t.maxLatencyMs
              : defaults.defaultMaxLatencyMs,
        });
      }
    }
  }
  return {
    targets,
    defaultUptimePercent:
      typeof raw.defaultUptimePercent === "number"
        ? raw.defaultUptimePercent
        : defaults.defaultUptimePercent,
    defaultMaxLatencyMs:
      typeof raw.defaultMaxLatencyMs === "number"
        ? raw.defaultMaxLatencyMs
        : defaults.defaultMaxLatencyMs,
  };
}

export function applySlaDefaults(target: Partial<SlaTarget>, cfg: SlaConfig): SlaTarget {
  return {
    url: target.url ?? "",
    uptimePercent: target.uptimePercent ?? cfg.defaultUptimePercent,
    maxLatencyMs: target.maxLatencyMs ?? cfg.defaultMaxLatencyMs,
  };
}

export function slaSummary(cfg: SlaConfig): string {
  return `SLA: ${cfg.targets.length} target(s), default uptime=${cfg.defaultUptimePercent}%, latency<=${cfg.defaultMaxLatencyMs}ms`;
}
