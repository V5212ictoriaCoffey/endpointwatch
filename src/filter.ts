/**
 * filter.ts
 * Provides filtering utilities for endpoints and results based on tags, status, and alert level.
 */

import { AlertLevel } from "./alerting";

export interface FilterOptions {
  tags?: string[];
  status?: number[];
  alertLevel?: AlertLevel[];
  urlPattern?: string;
}

export interface Filterable {
  url: string;
  tags?: string[];
  statusCode?: number;
  alertLevel?: AlertLevel;
}

export function matchesTags(item: Filterable, tags: string[]): boolean {
  if (!tags.length) return true;
  if (!item.tags || !item.tags.length) return false;
  return tags.every((t) => item.tags!.includes(t));
}

export function matchesStatus(item: Filterable, statuses: number[]): boolean {
  if (!statuses.length) return true;
  if (item.statusCode === undefined) return false;
  return statuses.includes(item.statusCode);
}

export function matchesAlertLevel(
  item: Filterable,
  levels: AlertLevel[]
): boolean {
  if (!levels.length) return true;
  if (item.alertLevel === undefined) return false;
  return levels.includes(item.alertLevel);
}

export function matchesUrlPattern(
  item: Filterable,
  pattern: string
): boolean {
  if (!pattern) return true;
  try {
    const re = new RegExp(pattern);
    return re.test(item.url);
  } catch {
    return item.url.includes(pattern);
  }
}

export function applyFilter<T extends Filterable>(
  items: T[],
  opts: FilterOptions
): T[] {
  return items.filter((item) => {
    if (opts.tags && !matchesTags(item, opts.tags)) return false;
    if (opts.status && !matchesStatus(item, opts.status)) return false;
    if (opts.alertLevel && !matchesAlertLevel(item, opts.alertLevel))
      return false;
    if (opts.urlPattern && !matchesUrlPattern(item, opts.urlPattern))
      return false;
    return true;
  });
}

export function parseFilterOptions(raw: Record<string, unknown>): FilterOptions {
  const opts: FilterOptions = {};
  if (Array.isArray(raw.tags)) opts.tags = raw.tags as string[];
  if (Array.isArray(raw.status)) opts.status = raw.status as number[];
  if (Array.isArray(raw.alertLevel))
    opts.alertLevel = raw.alertLevel as AlertLevel[];
  if (typeof raw.urlPattern === "string") opts.urlPattern = raw.urlPattern;
  return opts;
}
