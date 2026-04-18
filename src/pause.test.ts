import {
  createPauseStore,
  pauseEndpoint,
  resumeEndpoint,
  isPaused,
  pauseAll,
  resumeAll,
  listPaused,
  pauseSummary,
} from './pause';

describe('pause store', () => {
  it('starts empty', () => {
    const store = createPauseStore();
    expect(listPaused(store)).toEqual([]);
  });

  it('pauses and detects an endpoint', () => {
    const store = createPauseStore();
    pauseEndpoint(store, 'https://api.example.com/health');
    expect(isPaused(store, 'https://api.example.com/health')).toBe(true);
  });

  it('resumes an endpoint', () => {
    const store = createPauseStore();
    pauseEndpoint(store, 'https://api.example.com/health');
    resumeEndpoint(store, 'https://api.example.com/health');
    expect(isPaused(store, 'https://api.example.com/health')).toBe(false);
  });

  it('pauseAll adds multiple endpoints', () => {
    const store = createPauseStore();
    pauseAll(store, ['https://a.com', 'https://b.com']);
    expect(isPaused(store, 'https://a.com')).toBe(true);
    expect(isPaused(store, 'https://b.com')).toBe(true);
  });

  it('resumeAll removes multiple endpoints', () => {
    const store = createPauseStore();
    pauseAll(store, ['https://a.com', 'https://b.com']);
    resumeAll(store, ['https://a.com', 'https://b.com']);
    expect(listPaused(store)).toEqual([]);
  });

  it('pauseSummary with no paused endpoints', () => {
    const store = createPauseStore();
    expect(pauseSummary(store)).toBe('No endpoints paused.');
  });

  it('pauseSummary lists paused endpoints', () => {
    const store = createPauseStore();
    pauseEndpoint(store, 'https://api.example.com');
    const summary = pauseSummary(store);
    expect(summary).toContain('Paused endpoints (1)');
    expect(summary).toContain('https://api.example.com');
  });
});
