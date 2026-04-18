// correlation.ts — correlate alerts across endpoints by time window

export interface CorrelationEntry {
  endpointId: string;
  alertLevel: string;
  timestamp: number;
}

export interface CorrelationGroup {
  windowStart: number;
  windowEnd: number;
  entries: CorrelationEntry[];
  endpointIds: string[];
}

export function groupByWindow(
  entries: CorrelationEntry[],
  windowMs: number
): CorrelationGroup[] {
  if (entries.length === 0) return [];

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const groups: CorrelationGroup[] = [];
  let current: CorrelationEntry[] = [sorted[0]];
  let windowStart = sorted[0].timestamp;

  for (let i = 1; i < sorted.length; i++) {
    const entry = sorted[i];
    if (entry.timestamp - windowStart <= windowMs) {
      current.push(entry);
    } else {
      groups.push(toGroup(current, windowStart, windowMs));
      current = [entry];
      windowStart = entry.timestamp;
    }
  }
  if (current.length > 0) groups.push(toGroup(current, windowStart, windowMs));
  return groups;
}

function toGroup(
  entries: CorrelationEntry[],
  windowStart: number,
  windowMs: number
): CorrelationGroup {
  return {
    windowStart,
    windowEnd: windowStart + windowMs,
    entries,
    endpointIds: [...new Set(entries.map((e) => e.endpointId))],
  };
}

export function findCorrelated(
  entries: CorrelationEntry[],
  windowMs: number,
  minEndpoints = 2
): CorrelationGroup[] {
  return groupByWindow(entries, windowMs).filter(
    (g) => g.endpointIds.length >= minEndpoints
  );
}

export function formatCorrelation(group: CorrelationGroup): string {
  const ids = group.endpointIds.join(", ");
  const time = new Date(group.windowStart).toISOString();
  return `[${time}] Correlated alert across ${group.endpointIds.length} endpoints: ${ids}`;
}
