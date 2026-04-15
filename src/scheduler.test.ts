import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runOnce, startScheduler } from './scheduler';
import * as config from './config';
import * as monitor from './monitor';
import * as alerting from './alerting';
import * as reporter from './reporter';

const mockConfig = {
  endpoints: [
    { url: 'https://example.com/api', method: 'GET', timeoutMs: 5000 },
  ],
  alerting: { maxLatencyMs: 1000, maxErrorRate: 0.1 },
};

const mockResult = {
  url: 'https://example.com/api',
  status: 200,
  latencyMs: 120,
  ok: true,
  timestamp: new Date().toISOString(),
};

beforeEach(() => {
  vi.spyOn(config, 'loadConfig').mockResolvedValue(mockConfig as any);
  vi.spyOn(config, 'applyDefaults').mockImplementation(c => c as any);
  vi.spyOn(monitor, 'checkEndpoint').mockResolvedValue(mockResult as any);
  vi.spyOn(alerting, 'evaluateAll').mockReturnValue([]);
  vi.spyOn(reporter, 'writeReport').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('runOnce', () => {
  it('calls checkEndpoint for each configured endpoint', async () => {
    await runOnce({ configPath: 'endpointwatch.json' });
    expect(monitor.checkEndpoint).toHaveBeenCalledTimes(1);
    expect(monitor.checkEndpoint).toHaveBeenCalledWith(mockConfig.endpoints[0]);
  });

  it('calls evaluateAll with results and alerting config', async () => {
    await runOnce({ configPath: 'endpointwatch.json' });
    expect(alerting.evaluateAll).toHaveBeenCalledWith(
      [mockResult],
      mockConfig.alerting
    );
  });

  it('writes report when outputPath is provided', async () => {
    await runOnce({
      configPath: 'endpointwatch.json',
      outputPath: '/tmp/report.json',
      outputFormat: 'json',
    });
    expect(reporter.writeReport).toHaveBeenCalledWith(
      expect.any(Array),
      'json',
      '/tmp/report.json'
    );
  });

  it('does not write report when outputPath is omitted', async () => {
    await runOnce({ configPath: 'endpointwatch.json' });
    expect(reporter.writeReport).not.toHaveBeenCalled();
  });

  it('logs alerts when verbose and alerts exist', async () => {
    vi.spyOn(alerting, 'evaluateAll').mockReturnValue([
      { url: 'https://example.com/api', reason: 'high latency' } as any,
    ]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await runOnce({ configPath: 'endpointwatch.json', verbose: true });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('ALERT'));
  });
});

describe('startScheduler', () => {
  it('returns a handle with a stop function', () => {
    vi.useFakeTimers();
    const handle = startScheduler({ configPath: 'endpointwatch.json' }, 5000);
    expect(handle.stop).toBeTypeOf('function');
    handle.stop();
    vi.useRealTimers();
  });
});
