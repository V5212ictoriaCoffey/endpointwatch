import {
  createOncallStore,
  addOncallEntry,
  removeOncallEntry,
  getCurrentOncall,
  getUpcomingOncall,
  oncallSummary,
} from './oncall';
import { parseOncallConfig, applyOncallDefaults, oncallConfigSummary } from './oncall.config';

const NOW = 1_700_000_000_000;

function makeEntry(id: string, offset: number, duration = 3600_000) {
  return { id, name: `Person ${id}`, email: `${id}@example.com`, startTime: NOW + offset, endTime: NOW + offset + duration };
}

describe('oncall store', () => {
  it('returns undefined when no current oncall', () => {
    const store = createOncallStore();
    expect(getCurrentOncall(store, NOW)).toBeUndefined();
  });

  it('finds current oncall entry', () => {
    const store = createOncallStore();
    addOncallEntry(store, makeEntry('a', -1000, 10_000));
    expect(getCurrentOncall(store, NOW)?.id).toBe('a');
  });

  it('does not return expired entry', () => {
    const store = createOncallStore();
    addOncallEntry(store, makeEntry('b', -10_000, 5_000));
    expect(getCurrentOncall(store, NOW)).toBeUndefined();
  });

  it('removes entry', () => {
    const store = createOncallStore();
    addOncallEntry(store, makeEntry('c', -500, 5_000));
    removeOncallEntry(store, 'c');
    expect(getCurrentOncall(store, NOW)).toBeUndefined();
  });

  it('returns upcoming entries sorted', () => {
    const store = createOncallStore();
    addOncallEntry(store, makeEntry('d', 5_000));
    addOncallEntry(store, makeEntry('e', 2_000));
    const upcoming = getUpcomingOncall(store, NOW);
    expect(upcoming[0].id).toBe('e');
    expect(upcoming[1].id).toBe('d');
  });

  it('formats summary with current oncall', () => {
    const store = createOncallStore();
    addOncallEntry(store, makeEntry('f', -100, 10_000));
    const s = oncallSummary(store, NOW);
    expect(s).toContain('Person f');
  });
});

describe('oncall config', () => {
  it('parses entries from config', () => {
    const entries = parseOncallConfig({
      entries: [{ name: 'Alice', email: 'alice@x.com', startTime: NOW, endTime: NOW + 3600_000 }],
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe('Alice');
  });

  it('filters invalid entries', () => {
    const entries = applyOncallDefaults([
      { id: '1', name: '', email: 'x@y.com', startTime: NOW, endTime: NOW + 1000 },
      { id: '2', name: 'Bob', email: 'b@y.com', startTime: NOW + 1000, endTime: NOW },
    ]);
    expect(entries).toHaveLength(0);
  });

  it('returns summary string', () => {
    expect(oncallConfigSummary([])).toContain('no entries');
    const entries = parseOncallConfig({ entries: [{ name: 'A', email: 'a@b.com', startTime: NOW, endTime: NOW + 1000 }] });
    expect(oncallConfigSummary(entries)).toContain('1 schedule');
  });
});
