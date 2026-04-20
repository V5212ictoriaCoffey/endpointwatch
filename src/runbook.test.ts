import {
  createRunbookStore,
  addRunbook,
  removeRunbook,
  findRunbook,
  formatRunbook,
  runbookSummary,
} from './runbook';

describe('runbook', () => {
  it('starts empty', () => {
    const store = createRunbookStore();
    expect(store.entries).toHaveLength(0);
  });

  it('adds and retrieves a runbook entry', () => {
    const store = createRunbookStore();
    addRunbook(store, { url: 'https://wiki/runbook-1', alertLevel: 'critical', endpointPattern: 'api/health' });
    expect(store.entries).toHaveLength(1);
  });

  it('removes a runbook entry by url', () => {
    const store = createRunbookStore();
    addRunbook(store, { url: 'https://wiki/runbook-1' });
    const removed = removeRunbook(store, 'https://wiki/runbook-1');
    expect(removed).toBe(true);
    expect(store.entries).toHaveLength(0);
  });

  it('returns false when removing non-existent url', () => {
    const store = createRunbookStore();
    expect(removeRunbook(store, 'https://wiki/missing')).toBe(false);
  });

  it('finds runbook by endpoint pattern and alert level', () => {
    const store = createRunbookStore();
    addRunbook(store, { url: 'https://wiki/rb', alertLevel: 'critical', endpointPattern: 'api/health' });
    const found = findRunbook(store, 'https://example.com/api/health', 'critical');
    expect(found).toBeDefined();
    expect(found?.url).toBe('https://wiki/rb');
  });

  it('does not find runbook when alert level mismatches', () => {
    const store = createRunbookStore();
    addRunbook(store, { url: 'https://wiki/rb', alertLevel: 'critical', endpointPattern: 'api/health' });
    const found = findRunbook(store, 'https://example.com/api/health', 'warning');
    expect(found).toBeUndefined();
  });

  it('finds runbook with no pattern constraint for any endpoint', () => {
    const store = createRunbookStore();
    addRunbook(store, { url: 'https://wiki/generic', alertLevel: 'warning' });
    const found = findRunbook(store, 'https://example.com/anything', 'warning');
    expect(found).toBeDefined();
  });

  it('formats a runbook entry with url and steps', () => {
    const entry = { url: 'https://wiki/rb', steps: ['Check logs', 'Restart service'] };
    const output = formatRunbook(entry);
    expect(output).toContain('Runbook: https://wiki/rb');
    expect(output).toContain('1. Check logs');
    expect(output).toContain('2. Restart service');
  });

  it('formats an empty runbook entry', () => {
    expect(formatRunbook({})).toBe('(no runbook details)');
  });

  it('summarizes the runbook store', () => {
    const store = createRunbookStore();
    addRunbook(store, { url: 'https://wiki/rb', alertLevel: 'critical', endpointPattern: 'api' });
    const summary = runbookSummary(store);
    expect(summary).toContain('critical');
    expect(summary).toContain('api');
    expect(summary).toContain('https://wiki/rb');
  });

  it('summarizes empty store', () => {
    const store = createRunbookStore();
    expect(runbookSummary(store)).toBe('No runbooks configured.');
  });
});
