/**
 * cooldown.config.ts — Parse and apply defaults for cooldown configuration.
 */

import { CooldownOptions } from "./cooldown";

export interface CooldownConfig {
  enabled?: boolean;
  durationMs?: number;
  durationSec?: number;
}

const DEFAULT_DURATION_MS = 60_000;

export function parseCooldownConfig(raw: Record<string, unknown>): CooldownConfig {
  const cfg: CooldownConfig = {};

  if (typeof raw.cooldownEnabled === "boolean") cfg.enabled = raw.cooldownEnabled;
  if (typeof raw.cooldownDurationMs === "number") cfg.durationMs = raw.cooldownDurationMs;
  if (typeof raw.cooldownDurationSec === "number") cfg.durationSec = raw.cooldownDurationSec;

  return cfg;
}

export function applyCooldownDefaults(cfg: CooldownConfig): Required<Omit<CooldownConfig, "durationSec">> {
  let durationMs = cfg.durationMs ?? DEFAULT_DURATION_MS;
  if (cfg.durationSec !== undefined) {
    durationMs = cfg.durationSec * 1000;
  }
  return {
    enabled: cfg.enabled ?? true,
    durationMs,
  };
}

export function toCooldownOptions(cfg: CooldownConfig): CooldownOptions {
  const resolved = applyCooldownDefaults(cfg);
  return { durationMs: resolved.durationMs };
}

export function cooldownConfigSummary(cfg: CooldownConfig): string {
  const resolved = applyCooldownDefaults(cfg);
  return [
    `enabled=${resolved.enabled}`,
    `durationMs=${resolved.durationMs}`,
  ].join(", ");
}
