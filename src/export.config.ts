import { ExportFormat, ExportOptions } from './export';

const validFormats: ExportFormat[] = ['json', 'csv', 'markdown'];

export function parseExportConfig(raw: Record<string, unknown>): ExportOptions {
  const format = (raw.exportFormat as string) ?? 'json';
  if (!validFormats.includes(format as ExportFormat)) {
    throw new Error(`Invalid export format: "${format}". Must be one of: ${validFormats.join(', ')}`);
  }
  return {
    format: format as ExportFormat,
    outputPath: typeof raw.exportPath === 'string' ? raw.exportPath : undefined,
    pretty: raw.exportPretty === true,
  };
}

export function applyExportDefaults(opts: Partial<ExportOptions>): ExportOptions {
  return {
    format: opts.format ?? 'json',
    outputPath: opts.outputPath,
    pretty: opts.pretty ?? false,
  };
}

export function exportSummary(opts: ExportOptions): string {
  const parts = [`format=${opts.format}`];
  if (opts.outputPath) parts.push(`output=${opts.outputPath}`);
  if (opts.pretty) parts.push('pretty=true');
  return `export(${parts.join(', ')})`;
}
