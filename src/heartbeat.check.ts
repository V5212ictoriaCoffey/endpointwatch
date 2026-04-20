import { HeartbeatStore, heartbeatUptime, lastHeartbeat, getHeartbeats } from './heartbeat';
import { HeartbeatConfig } from './heartbeat.config';

export interface HeartbeatCheckResult {
  url: string;
  uptime: number;
  belowThreshold: boolean;
  missedCount: number;
  tooManyMissed: boolean;
  lastSeen: number | null;
}

export function checkHeartbeat(
  store: HeartbeatStore,
  url: string,
  cfg: HeartbeatConfig
): HeartbeatCheckResult {
  const uptime = heartbeatUptime(store, url);
  const entries = getHeartbeats(store, url);
  const missed = entries.filter(e => !e.ok).length;
  const last = lastHeartbeat(store, url);
  return {
    url,
    uptime,
    belowThreshold: uptime < cfg.minUptimeRatio,
    missedCount: missed,
    tooManyMissed: cfg.alertOnMissed && missed >= cfg.missedThreshold,
    lastSeen: last ? last.timestamp : null,
  };
}

export function checkAllHeartbeats(
  store: HeartbeatStore,
  cfg: HeartbeatConfig
): HeartbeatCheckResult[] {
  return Array.from(store.entries.keys()).map(url => checkHeartbeat(store, url, cfg));
}

export function formatHeartbeatResult(r: HeartbeatCheckResult): string {
  const uptime = (r.uptime * 100).toFixed(2);
  const flags: string[] = [];
  if (r.belowThreshold) flags.push('LOW_UPTIME');
  if (r.tooManyMissed) flags.push('TOO_MANY_MISSED');
  const status = flags.length ? flags.join(',') : 'OK';
  return `[${status}] ${r.url} uptime=${uptime}% missed=${r.missedCount}`;
}
