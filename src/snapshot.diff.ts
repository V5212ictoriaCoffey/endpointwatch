import { Snapshot } from './snapshot';

export interface SnapshotDiff {
  url: string;
  prev: Snapshot;
  curr: Snapshot;
  statusChanged: boolean;
  latencyDeltaMs: number;
  okChanged: boolean;
}

export function diffSnapshots(prev: Snapshot, curr: Snapshot): SnapshotDiff {
  return {
    url: curr.url,
    prev,
    curr,
    statusChanged: prev.statusCode !== curr.statusCode,
    latencyDeltaMs: curr.latencyMs - prev.latencyMs,
    okChanged: prev.ok !== curr.ok,
  };
}

export function formatDiff(diff: SnapshotDiff): string {
  const lines: string[] = [`[${diff.url}]`];
  if (diff.statusChanged)
    lines.push(`  status: ${diff.prev.statusCode} → ${diff.curr.statusCode}`);
  if (diff.okChanged)
    lines.push(`  ok: ${diff.prev.ok} → ${diff.curr.ok}`);
  const sign = diff.latencyDeltaMs >= 0 ? '+' : '';
  lines.push(`  latency: ${sign}${diff.latencyDeltaMs}ms`);
  return lines.join('\n');
}

export function hasMeaningfulChange(diff: SnapshotDiff, latencyThresholdMs = 200): boolean {
  return diff.statusChanged || diff.okChanged || Math.abs(diff.latencyDeltaMs) >= latencyThresholdMs;
}
