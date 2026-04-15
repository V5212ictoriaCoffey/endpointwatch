import * as fs from 'fs';
import * as path from 'path';
import { MonitorResult } from './monitor';
import { AlertSummary } from './alerting';

export interface ReportEntry {
  timestamp: string;
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  ok: boolean;
  alerts: string[];
}

export interface ReportOptions {
  format: 'json' | 'csv';
  outputPath?: string;
}

export function buildReportEntry(
  result: MonitorResult,
  summary: AlertSummary
): ReportEntry {
  return {
    timestamp: new Date().toISOString(),
    endpoint: result.endpoint,
    statusCode: result.statusCode,
    latencyMs: result.latencyMs,
    ok: result.ok,
    alerts: summary.messages,
  };
}

export function formatJson(entries: ReportEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

export function formatCsv(entries: ReportEntry[]): string {
  const header = 'timestamp,endpoint,statusCode,latencyMs,ok,alerts';
  const rows = entries.map((e) =>
    [
      e.timestamp,
      `"${e.endpoint}"`,
      e.statusCode,
      e.latencyMs,
      e.ok,
      `"${e.alerts.join('; ')}"`,
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

export function writeReport(entries: ReportEntry[], options: ReportOptions): void {
  const content =
    options.format === 'csv' ? formatCsv(entries) : formatJson(entries);

  if (options.outputPath) {
    const dir = path.dirname(options.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(options.outputPath, content, 'utf-8');
  } else {
    process.stdout.write(content + '\n');
  }
}
