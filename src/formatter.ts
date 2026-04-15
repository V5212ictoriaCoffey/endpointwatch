/**
 * formatter.ts
 * Utilities for formatting latency, status codes, and alert messages
 * for human-readable CLI output.
 */

export type AlertLevel = 'ok' | 'warn' | 'error';

export interface FormattedResult {
  timestamp: string;
  endpoint: string;
  status: number | null;
  latencyMs: number | null;
  alertLevel: AlertLevel;
  message: string;
}

export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

export function formatLatency(ms: number | null): string {
  if (ms === null) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatStatus(status: number | null): string {
  if (status === null) return 'ERR';
  return String(status);
}

export function alertLevelColor(level: AlertLevel): string {
  switch (level) {
    case 'ok':    return '\x1b[32m'; // green
    case 'warn':  return '\x1b[33m'; // yellow
    case 'error': return '\x1b[31m'; // red
    default:      return '\x1b[0m';
  }
}

const RESET = '\x1b[0m';

export function formatLine(result: FormattedResult, colorize = true): string {
  const color = colorize ? alertLevelColor(result.alertLevel) : '';
  const reset = colorize ? RESET : '';
  const latency = formatLatency(result.latencyMs);
  const status = formatStatus(result.status);
  const level = result.alertLevel.toUpperCase().padEnd(5);
  return `${color}[${result.timestamp}] ${level} ${result.endpoint} — HTTP ${status} in ${latency}${reset}`;
}

export function formatAlert(result: FormattedResult, colorize = true): string {
  if (result.alertLevel === 'ok') return '';
  const color = colorize ? alertLevelColor(result.alertLevel) : '';
  const reset = colorize ? RESET : '';
  return `${color}  ⚠ ALERT: ${result.message}${reset}`;
}
