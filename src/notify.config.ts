import type { NotifyChannel, NotifyRule } from "./notify";
import type { AlertLevel } from "./alerting";

export interface NotifyConfig {
  rules?: Array<{
    channel: string;
    minLevel?: string;
    target?: string;
    enabled?: boolean;
  }>;
}

const VALID_CHANNELS: NotifyChannel[] = ["slack", "email", "webhook", "console"];
const VALID_LEVELS: AlertLevel[] = ["none", "warn", "critical"];

function isValidChannel(c: string): c is NotifyChannel {
  return VALID_CHANNELS.includes(c as NotifyChannel);
}

function isValidLevel(l: string): l is AlertLevel {
  return VALID_LEVELS.includes(l as AlertLevel);
}

export function parseNotifyConfig(raw: unknown): NotifyConfig {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const config: NotifyConfig = {};

  if (Array.isArray(obj["rules"])) {
    config.rules = (obj["rules"] as unknown[]).filter(
      (r) => r && typeof r === "object"
    ) as NotifyConfig["rules"];
  }

  return config;
}

export function applyNotifyDefaults(config: NotifyConfig): NotifyConfig {
  return {
    rules: config.rules ?? [],
  };
}

export function toNotifyRules(config: NotifyConfig): NotifyRule[] {
  const rules = config.rules ?? [];
  return rules
    .filter((r) => isValidChannel(r.channel))
    .map((r) => ({
      channel: r.channel as NotifyChannel,
      minLevel: isValidLevel(r.minLevel ?? "") ? (r.minLevel as AlertLevel) : "warn",
      target: r.target,
      enabled: r.enabled !== false,
    }));
}

export function notifyConfigSummary(config: NotifyConfig): string {
  const count = config.rules?.length ?? 0;
  const enabled = (config.rules ?? []).filter((r) => r.enabled !== false).length;
  return `notify config: ${count} rules (${enabled} enabled)`;
}
