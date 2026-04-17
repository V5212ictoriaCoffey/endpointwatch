import { exportEntries, toMarkdown, toJson, toCsv } from './export';
import { parseExportConfig, applyExportDefaults, exportSummary } from './export.config';
import { ReportEntry } from './reporter';

function makeEntry(overrides: Partial<ReportEntry> = {}): ReportEntry {
  return {
    url: 'https://example.com/api',
    status: 200,
    latency: 123,
    alertLevel: 'none',
    timestamp: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('export', () => {
  const entries = [makeEntry(), makeEntry({ status: 500, alertLevel: 'critical', latency: 999 })];

  test('toJson produces valid JSON', () => {
    const out = toJson(entries);
    expect(() => JSON.parse(out)).not.toThrow();
    expect(JSON.parse(out)).toHaveLength(2);
  });

  test('toJson pretty includes newlines', () => {
    const out = toJson(entries, true);
    expect(out).toContain('\n');
  });

  test('toCsv has header and rows', () => {
    const out = toCsv(entries);
    const lines = out.split('\n');
    expect(lines[0]).toMatch(/url,status/);
    expect(lines).toHaveLength(3);
  });

  test('toMarkdown has table structure', () => {
    const out = toMarkdown(entries);
    expect(out).toContain('|');
    expect(out).toContain('---');
    const lines = out.split('\n');
    expect(lines).toHaveLength(4);
  });

  test('exportEntries dispatches by format', () => {
    expect(exportEntries(entries, { format: 'csv' })).toContain('url,status');
    expect(exportEntries(entries, { format: 'markdown' })).toContain('| URL |');
    expect(exportEntries(entries, { format: 'json' })).toContain('[{');
  });

  test('exportEntries throws on unknown format', () => {
    expect(() => exportEntries(entries, { format: 'xml' as any })).toThrow();
  });
});

describe('export.config', () => {
  test('parseExportConfig returns defaults', () => {
    const cfg = parseExportConfig({});
    expect(cfg.format).toBe('json');
    expect(cfg.pretty).toBe(false);
  });

  test('parseExportConfig parses valid format', () => {
    const cfg = parseExportConfig({ exportFormat: 'markdown', exportPretty: true });
    expect(cfg.format).toBe('markdown');
    expect(cfg.pretty).toBe(true);
  });

  test('parseExportConfig throws on invalid format', () => {
    expect(() => parseExportConfig({ exportFormat: 'xml' })).toThrow();
  });

  test('applyExportDefaults fills missing fields', () => {
    const cfg = applyExportDefaults({ format: 'csv' });
    expect(cfg.pretty).toBe(false);
    expect(cfg.outputPath).toBeUndefined();
  });

  test('exportSummary includes format', () => {
    const s = exportSummary({ format: 'json', pretty: true, outputPath: '/tmp/out.json' });
    expect(s).toContain('format=json');
    expect(s).toContain('pretty=true');
    expect(s).toContain('output=/tmp/out.json');
  });
});
