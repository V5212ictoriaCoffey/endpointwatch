import {
  createIncidentStore,
  openIncident,
  resolveIncident,
  getOpenIncidents,
  getIncidentsByUrl,
  incidentSummary,
} from './incident';

const URL = 'https://api.example.com/health';

describe('incident', () => {
  it('opens an incident', () => {
    const store = createIncidentStore();
    const inc = openIncident(store, 'inc-1', URL, 'high', 'timeout', 1000);
    expect(inc.id).toBe('inc-1');
    expect(inc.resolved).toBe(false);
    expect(inc.openedAt).toBe(1000);
  });

  it('resolves an incident', () => {
    const store = createIncidentStore();
    openIncident(store, 'inc-1', URL, 'high', 'timeout', 1000);
    const resolved = resolveIncident(store, 'inc-1', 2000);
    expect(resolved?.resolved).toBe(true);
    expect(resolved?.resolvedAt).toBe(2000);
  });

  it('returns undefined when resolving unknown incident', () => {
    const store = createIncidentStore();
    expect(resolveIncident(store, 'nope')).toBeUndefined();
  });

  it('returns undefined when resolving already-resolved incident', () => {
    const store = createIncidentStore();
    openIncident(store, 'inc-1', URL, 'low', 'msg', 1000);
    resolveIncident(store, 'inc-1', 2000);
    expect(resolveIncident(store, 'inc-1', 3000)).toBeUndefined();
  });

  it('lists open incidents', () => {
    const store = createIncidentStore();
    openIncident(store, 'inc-1', URL, 'high', 'err', 1000);
    openIncident(store, 'inc-2', URL, 'low', 'warn', 1000);
    resolveIncident(store, 'inc-1', 2000);
    const open = getOpenIncidents(store);
    expect(open).toHaveLength(1);
    expect(open[0].id).toBe('inc-2');
  });

  it('filters incidents by url', () => {
    const store = createIncidentStore();
    openIncident(store, 'inc-1', URL, 'high', 'err', 1000);
    openIncident(store, 'inc-2', 'https://other.com', 'low', 'warn', 1000);
    const results = getIncidentsByUrl(store, URL);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('inc-1');
  });

  it('summarizes the store', () => {
    const store = createIncidentStore();
    openIncident(store, 'inc-1', URL, 'critical', 'down', 1000);
    openIncident(store, 'inc-2', URL, 'medium', 'slow', 1000);
    resolveIncident(store, 'inc-1', 2000);
    expect(incidentSummary(store)).toBe('incidents: 2 total, 1 open');
  });
});
