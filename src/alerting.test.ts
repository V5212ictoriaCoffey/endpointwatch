import { evaluateResult, evaluateAll } from './alerting';
import { ProbeResult } from './monitor';

function makeResult(overrides: Partial<ProbeResult> = {}): ProbeResult {
  return {
    url: 'https://example.com/health',
    status: 'up',
    statusCode: 200,
    latencyMs: 120,
    timestamp: new Date(),
    ...overrides,
  };
}

describe('evaluateResult', () => {
  it('returns null when everything is within thresholds', () => {
    const alert = evaluateResult(makeResult(), { maxLatencyMs: 500, allowedStatusCodes: [200] });
    expect(alert).toBeNull();
  });

  it('fires a down alert when endpoint is unreachable', () => {
    const result = makeResult({ status: 'down', statusCode: undefined, error: 'ECONNREFUSED' });
    const alert = evaluateResult(result, {});

    expect(alert).not.toBeNull();
    expect(alert?.reason).toBe('down');
    expect(alert?.message).toMatch(/ECONNREFUSED/);
  });

  it('fires a latency alert when latency exceeds threshold', () => {
    const result = makeResult({ latencyMs: 800 });
    const alert = evaluateResult(result, { maxLatencyMs: 500 });

    expect(alert).not.toBeNull();
    expect(alert?.reason).toBe('latency');
    expect(alert?.message).toMatch(/800ms/);
  });

  it('fires an unexpected_status alert for disallowed status codes', () => {
    const result = makeResult({ statusCode: 404, status: 'down' });
    const alert = evaluateResult(result, { allowedStatusCodes: [200, 201] });

    expect(alert).not.toBeNull();
    expect(alert?.reason).toBe('unexpected_status');
    expect(alert?.message).toMatch(/404/);
  });

  it('does not fire unexpected_status when allowedStatusCodes is empty', () => {
    const result = makeResult({ statusCode: 404 });
    const alert = evaluateResult(result, { allowedStatusCodes: [] });
    expect(alert).toBeNull();
  });
});

describe('evaluateAll', () => {
  it('returns only alerts for failing results', () => {
    const results = [
      makeResult({ url: 'https://a.example.com', latencyMs: 50 }),
      makeResult({ url: 'https://b.example.com', latencyMs: 1200 }),
    ];

    const alerts = evaluateAll(results, { maxLatencyMs: 500 });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].url).toBe('https://b.example.com');
  });

  it('returns an empty array when all results pass', () => {
    const results = [makeResult(), makeResult({ url: 'https://b.example.com' })];
    const alerts = evaluateAll(results, { maxLatencyMs: 1000 });
    expect(alerts).toHaveLength(0);
  });
});
