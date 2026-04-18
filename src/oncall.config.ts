import { OncallEntry } from './oncall';

export interface OncallConfig {
  entries?: Array<{
    id?: string;
    name: string;
    email: string;
    startTime: string | number;
    endTime: string | number;
  }>;
}

function toTimestamp(val: string | number): number {
  if (typeof val === 'number') return val;
  return new Date(val).getTime();
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function parseOncallConfig(raw: unknown): OncallEntry[] {
  if (!raw || typeof raw !== 'object') return [];
  const cfg = raw as OncallConfig;
  if (!Array.isArray(cfg.entries)) return [];
  return cfg.entries.map(e => ({
    id: e.id ?? randomId(),
    name: e.name,
    email: e.email,
    startTime: toTimestamp(e.startTime),
    endTime: toTimestamp(e.endTime),
  }));
}

export function applyOncallDefaults(entries: OncallEntry[]): OncallEntry[] {
  return entries.filter(e => e.name && e.email && e.endTime > e.startTime);
}

export function oncallConfigSummary(entries: OncallEntry[]): string {
  if (entries.length === 0) return 'oncall: no entries configured';
  return `oncall: ${entries.length} schedule(s) loaded`;
}
