/**
 * grouping.config.ts — Parse and resolve grouping configuration
 */

import type { GroupingOptions } from "./grouping";

const VALID_BY = ["tag", "label", "urlPrefix"] as const;
type GroupBy = (typeof VALID_BY)[number];

export interface RawGroupingConfig {
  by?: string;
  value?: string;
}

export function parseGroupingConfig(raw: RawGroupingConfig): GroupingOptions {
  const by = raw.by as GroupBy;
  if (!VALID_BY.includes(by)) {
    throw new Error(
      `Invalid grouping.by "${raw.by}". Must be one of: ${VALID_BY.join(", ")}`
    );
  }
  return { by, value: raw.value };
}

export function applyGroupingDefaults(
  opts: Partial<GroupingOptions>
): GroupingOptions {
  return {
    by: opts.by ?? "tag",
    value: opts.value,
  };
}

export function groupingConfigSummary(opts: GroupingOptions): string {
  const parts = [`by=${opts.by}`];
  if (opts.value) parts.push(`value=${opts.value}`);
  return `grouping(${parts.join(", ")})`;
}
