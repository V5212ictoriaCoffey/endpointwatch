export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Incident {
  id: string;
  url: string;
  severity: IncidentSeverity;
  message: string;
  openedAt: number;
  resolvedAt?: number;
  resolved: boolean;
}

export interface IncidentStore {
  incidents: Map<string, Incident>;
}

export function createIncidentStore(): IncidentStore {
  return { incidents: new Map() };
}

export function openIncident(
  store: IncidentStore,
  id: string,
  url: string,
  severity: IncidentSeverity,
  message: string,
  now = Date.now()
): Incident {
  const incident: Incident = { id, url, severity, message, openedAt: now, resolved: false };
  store.incidents.set(id, incident);
  return incident;
}

export function resolveIncident(
  store: IncidentStore,
  id: string,
  now = Date.now()
): Incident | undefined {
  const incident = store.incidents.get(id);
  if (!incident || incident.resolved) return undefined;
  incident.resolved = true;
  incident.resolvedAt = now;
  return incident;
}

export function getOpenIncidents(store: IncidentStore): Incident[] {
  return Array.from(store.incidents.values()).filter(i => !i.resolved);
}

export function getIncidentsByUrl(store: IncidentStore, url: string): Incident[] {
  return Array.from(store.incidents.values()).filter(i => i.url === url);
}

export function incidentSummary(store: IncidentStore): string {
  const open = getOpenIncidents(store);
  return `incidents: ${store.incidents.size} total, ${open.length} open`;
}
