import { createWindow, windowSummary } from './window';

const BASE = 1_000_000;

describe('createWindow', () => {
  it('adds and retrieves current items', () => {
    const w = createWindow<number>({ size: 5000, step: 1000 });
    w.add(1, BASE);
    w.add(2, BASE + 1000);
    expect(w.current(BASE + 2000)).toEqual([1, 2]);
  });

  it('prunes old items', () => {
    const w = createWindow<number>({ size: 2000, step: 1000 });
    w.add(1, BASE);
    w.add(2, BASE + 3000);
    expect(w.current(BASE + 4000)).toEqual([2]);
  });

  it('returns buckets with correct items', () => {
    const w = createWindow<string>({ size: 4000, step: 2000 });
    w.add('a', BASE);
    w.add('b', BASE + 2500);
    const bs = w.buckets(BASE + 4000);
    expect(bs.length).toBe(2);
    expect(bs[0].items).toContain('a');
    expect(bs[1].items).toContain('b');
  });

  it('clear empties the store', () => {
    const w = createWindow<number>({ size: 5000, step: 1000 });
    w.add(42, BASE);
    w.clear();
    expect(w.size()).toBe(0);
  });

  it('size reflects count', () => {
    const w = createWindow<number>({ size: 5000, step: 1000 });
    w.add(1, BASE);
    w.add(2, BASE + 100);
    expect(w.size()).toBe(2);
  });
});

describe('windowSummary', () => {
  it('formats correctly', () => {
    expect(windowSummary({ size: 10000, step: 2000 })).toBe('window size=10000ms step=2000ms');
  });
});
