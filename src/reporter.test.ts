import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  buildReportEntry,
  formatJson,
  formatCsv,
  writeReport,
  ReportEntry,
} from './reporter';

function makeResult(overrides: Partial<ReturnType<typeof makeResult>> = {}) {
  return {
    endpoint: 'https://example.com/api',
    statusCode: 200,
    latencyMs: 120,
    ok: true,
    ...overrides,
  };
}

function makeSummary(messages: string[] = []) {
  return { triggered: messages.length > 0, messages };
}

describe('buildReportEntry', () => {
  it('maps result and summary into a report entry', () => {
    const result = makeResult();
    const summary = makeSummary(['High latency']);
    const entry = buildReportEntry(result, summary);
    expect(entry.endpoint).toBe(result.endpoint);
    expect(entry.statusCode).toBe(200);
    expect(entry.latencyMs).toBe(120);
    expect(entry.ok).toBe(true);
    expect(entry.alerts).toEqual(['High latency']);
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('formatJson', () => {
  it('produces valid JSON array', () => {
    const entry = buildReportEntry(makeResult(), makeSummary());
    const output = formatJson([entry]);
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].endpoint).toBe('https://example.com/api');
  });
});

describe('formatCsv', () => {
  it('includes header and one data row', () => {
    const entry = buildReportEntry(makeResult(), makeSummary(['Timeout']));
    const output = formatCsv([entry]);
    const lines = output.split('\n');
    expect(lines[0]).toBe('timestamp,endpoint,statusCode,latencyMs,ok,alerts');
    expect(lines[1]).toContain('https://example.com/api');
    expect(lines[1]).toContain('Timeout');
  });
});

describe('writeReport', () => {
  it('writes a JSON file to the specified path', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ew-'));
    const outputPath = path.join(tmpDir, 'report.json');
    const entry = buildReportEntry(makeResult(), makeSummary());
    writeReport([entry], { format: 'json', outputPath });
    const raw = fs.readFileSync(outputPath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveLength(1);
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('writes a CSV file to the specified path', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ew-'));
    const outputPath = path.join(tmpDir, 'report.csv');
    const entry = buildReportEntry(makeResult(), makeSummary());
    writeReport([entry], { format: 'csv', outputPath });
    const raw = fs.readFileSync(outputPath, 'utf-8');
    expect(raw).toContain('timestamp,endpoint');
    fs.rmSync(tmpDir, { recursive: true });
  });
});
