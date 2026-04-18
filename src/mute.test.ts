import {
  createMuteStore,
  muteEndpoint,
  unmuteEndpoint,
  isMuted,
  listMuted,
  muteSummary,
  muteAll,
} from './mute';

describe('mute store', () => {
  it('starts empty', () => {
    const store = createMuteStore();
    expect(listMuted(store)).toHaveLength(0);
  });

  it('mutes and detects muted endpoint', () => {
    const store = createMuteStore();
    muteEndpoint(store, 'https://api.example.com', 60_000, 'maintenance');
    expect(isMuted(store, 'https://api.example.com')).toBe(true);
  });

  it('returns false for unknown endpoint', () => {
    const store = createMuteStore();
    expect(isMuted(store, 'https://other.com')).toBe(false);
  });

  it('unmutes endpoint', () => {
    const store = createMuteStore();
    muteEndpoint(store, 'https://api.example.com', 60_000);
    unmuteEndpoint(store, 'https://api.example.com');
    expect(isMuted(store, 'https://api.example.com')).toBe(false);
  });

  it('auto-expires mute', () => {
    const store = createMuteStore();
    muteEndpoint(store, 'https://api.example.com', -1); // already expired
    expect(isMuted(store, 'https://api.example.com')).toBe(false);
  });

  it('lists only active mutes', () => {
    const store = createMuteStore();
    muteEndpoint(store, 'https://a.com', 60_000);
    muteEndpoint(store, 'https://b.com', -1);
    const muted = listMuted(store);
    expect(muted).toHaveLength(1);
    expect(muted[0].url).toBe('https://a.com');
  });

  it('muteAll sets all tracked entries', () => {
    const store = createMuteStore();
    muteEndpoint(store, 'https://a.com', 1000);
    muteEndpoint(store, 'https://b.com', 1000);
    muteAll(store, 120_000, 'global pause');
    expect(isMuted(store, 'https://a.com')).toBe(true);
    expect(isMuted(store, 'https://b.com')).toBe(true);
  });

  it('summary returns no-mute message when empty', () => {
    const store = createMuteStore();
    expect(muteSummary(store)).toBe('No endpoints muted.');
  });

  it('summary lists muted endpoints', () => {
    const store = createMuteStore();
    muteEndpoint(store, 'https://api.example.com', 60_000, 'test');
    const summary = muteSummary(store);
    expect(summary).toContain('https://api.example.com');
    expect(summary).toContain('test');
  });
});
