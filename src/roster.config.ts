/**
 * roster.config.ts — Parse and apply defaults for roster configuration.
 */

import type { RosterEntry } from "./roster";

export interface RosterConfig {
  entries: RosterEntry[];
  rotationEnabled: boolean;
  fallbackContact?: string;
}

const DEFAULT_ROSTER_CONFIG: RosterConfig = {
  entries: [],
  rotationEnabled: true,
};

export function parseRosterConfig(raw: Record<string, unknown>): RosterConfig {
  const entries: RosterEntry[] = [];

  if (Array.isArray(raw["entries"])) {
    for (const item of raw["entries"] as Record<string, unknown>[]) {
      if (typeof item["id"] === "string" && typeof item["contact"] === "string") {
        entries.push({
          id: item["id"],
          name: typeof item["name"] === "string" ? item["name"] : item["id"],
          contact: item["contact"],
          tags: Array.isArray(item["tags"]) ? (item["tags"] as string[]) : [],
          active: item["active"] !== false,
        });
      }
    }
  }

  return {
    entries,
    rotationEnabled: raw["rotationEnabled"] !== false,
    fallbackContact:
      typeof raw["fallbackContact"] === "string" ? raw["fallbackContact"] : undefined,
  };
}

export function applyRosterDefaults(partial: Partial<RosterConfig>): RosterConfig {
  return { ...DEFAULT_ROSTER_CONFIG, ...partial };
}

export function rosterConfigSummary(config: RosterConfig): string {
  const lines: string[] = [
    `rotationEnabled: ${config.rotationEnabled}`,
    `entries: ${config.entries.length}`,
  ];
  if (config.fallbackContact) {
    lines.push(`fallbackContact: ${config.fallbackContact}`);
  }
  return lines.join(", ");
}
