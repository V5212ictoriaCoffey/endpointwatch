import { ReportEntry } from './reporter';

export type ExportFormat = 'json' | 'csv' | 'markdown';

export interface ExportOptions {
  format: ExportFormat;
  outputPath?: string;
  pretty?: boolean;
}

export function toMarkdown(entries: ReportEntry[]): string {
  const header = '| URL | Status | Latency (ms) | Alert | Timestamp |';
  const sep = '|-----|--------|--------------|-------|-----------|';
  const rows = entries.map(e =>
    `| ${e.url} | ${e.status ?? 'ERR'} | ${e.latency ?? '-'} | ${e.alertLevel} | ${e.timestamp} |`
  );
  return [header, sep, ...rows].join('\n');
}

export function toJson(entries: ReportEntry[], pretty = false): string {
  return pretty
    ? JSON.stringify(entries, null, 2)
    : JSON.stringify(entries);
}

export function toCsv(entries: ReportEntry[]): string {
  const header = 'url,status,latency,alertLevel,timestamp';
  const rows = entries.map(e =>
    `${e.url},${e.status ?? ''},${e.latency ?? ''},${e.alertLevel},${e.timestamp}`
  );
  return [header, ...rows].join('\n');
}

export function exportEntries(entries: ReportEntry[], opts: ExportOptions): string {
  switch (opts.format) {
    case 'json': return toJson(entries, opts.pretty);
    case 'csv': return toCsv(entries);
    case 'markdown': return toMarkdown(entries);
    default: throw new Error(`Unknown export format: ${opts.format}`);
  }
}
