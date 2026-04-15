import {
  formatTimestamp,
  formatLatency,
  formatStatus,
  formatLine,
  formatAlert,
  FormattedResult,
} from './formatter';

function makeResult(overrides: Partial<FormattedResult> = {}): FormattedResult {
  return {
    timestamp: '2024-01-15 12:00:00',
    endpoint: 'https://example.com/api/health',
    status: 200,
    latencyMs: 142,
    alertLevel: 'ok',
    message: '',
    ...overrides,
  };
}

describe('formatTimestamp', () => {
  it('returns ISO-like string without T and milliseconds', () => {
    const ts = formatTimestamp(new Date('2024-06-01T08:30:00.000Z'));
    expect(ts).toBe('2024-06-01 08:30:00');
  });
});

describe('formatLatency', () => {
  it('returns N/A for null', () => {
    expect(formatLatency(null)).toBe('N/A');
  });

  it('formats sub-second latency with ms suffix', () => {
    expect(formatLatency(250)).toBe('250ms');
  });

  it('formats latency >= 1000ms as seconds', () => {
    expect(formatLatency(1500)).toBe('1.50s');
  });
});

describe('formatStatus', () => {
  it('returns ERR for null status', () => {
    expect(formatStatus(null)).toBe('ERR');
  });

  it('returns string representation of status code', () => {
    expect(formatStatus(404)).toBe('404');
  });
});

describe('formatLine', () => {
  it('includes endpoint, status, and latency', () => {
    const result = makeResult();
    const line = formatLine(result, false);
    expect(line).toContain('https://example.com/api/health');
    expect(line).toContain('HTTP 200');
    expect(line).toContain('142ms');
  });

  it('includes alert level label', () => {
    const result = makeResult({ alertLevel: 'warn' });
    const line = formatLine(result, false);
    expect(line).toContain('WARN');
  });

  it('handles null status and latency gracefully', () => {
    const result = makeResult({ status: null, latencyMs: null, alertLevel: 'error' });
    const line = formatLine(result, false);
    expect(line).toContain('HTTP ERR');
    expect(line).toContain('N/A');
  });
});

describe('formatAlert', () => {
  it('returns empty string for ok level', () => {
    const result = makeResult({ alertLevel: 'ok', message: '' });
    expect(formatAlert(result, false)).toBe('');
  });

  it('includes message for warn level', () => {
    const result = makeResult({ alertLevel: 'warn', message: 'Latency exceeded 500ms threshold' });
    const alert = formatAlert(result, false);
    expect(alert).toContain('Latency exceeded 500ms threshold');
    expect(alert).toContain('ALERT');
  });

  it('includes message for error level', () => {
    const result = makeResult({ alertLevel: 'error', message: 'HTTP 503 received' });
    const alert = formatAlert(result, false);
    expect(alert).toContain('HTTP 503 received');
  });
});
