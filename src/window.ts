export interface WindowOptions {
  size: number; // ms
  step: number; // ms
}

export interface WindowBucket<T> {
  start: number;
  end: number;
  items: T[];
}

export function createWindow<T>(options: WindowOptions) {
  const { size, step } = options;
  const items: Array<{ ts: number; value: T }> = [];

  function add(value: T, ts = Date.now()) {
    items.push({ ts, value });
  }

  function prune(now = Date.now()) {
    const cutoff = now - size;
    while (items.length && items[0].ts < cutoff) items.shift();
  }

  function buckets(now = Date.now()): WindowBucket<T>[] {
    prune(now);
    const result: WindowBucket<T>[] = [];
    let start = now - size;
    while (start < now) {
      const end = start + step;
      result.push({
        start,
        end,
        items: items.filter(i => i.ts >= start && i.ts < end).map(i => i.value),
      });
      start = end;
    }
    return result;
  }

  function current(now = Date.now()): T[] {
    prune(now);
    return items.map(i => i.value);
  }

  function size_() {
    return items.length;
  }

  function clear() {
    items.length = 0;
  }

  return { add, prune, buckets, current, size: size_, clear };
}

export function windowSummary(options: WindowOptions): string {
  return `window size=${options.size}ms step=${options.step}ms`;
}
