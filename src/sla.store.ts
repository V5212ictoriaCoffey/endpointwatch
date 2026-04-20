import type { SlaResult } from "./sla";

export interface SlaStore {
  results: Map<string, SlaResult>;
}

export function createSlaStore(): SlaStore {
  return { results: new Map() };
}

export function recordSlaResult(store: SlaStore, result: SlaResult): void {
  store.results.set(result.url, result);
}

export function getSlaResult(store: SlaStore, url: string): SlaResult | undefined {
  return store.results.get(url);
}

export function getBreachedSlas(store: SlaStore): SlaResult[] {
  return Array.from(store.results.values()).filter((r) => !r.met);
}

export function getAllSlaResults(store: SlaStore): SlaResult[] {
  return Array.from(store.results.values());
}

export function clearSlaStore(store: SlaStore): void {
  store.results.clear();
}

export function slaStoreSummary(store: SlaStore): string {
  const all = getAllSlaResults(store);
  const breached = getBreachedSlas(store);
  return `SLA store: ${all.length} tracked, ${breached.length} breached`;
}
