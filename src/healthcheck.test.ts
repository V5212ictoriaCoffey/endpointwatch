import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkEndpoint, isHealthy } from './healthcheck';

function mockFetch(status: number, delayMs = 0) {
  return vi.fn().mockImplementation(
    () =>
      new Promise((resolve) =>
        setTimeout(() => resolve({ status }), delayMs)
      )
  );
}

describe('checkEndpoint', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns ok result for expected status', async () => {
    global.fetch = mockFetch(200);
    const promise = checkEndpoint('https://example.com', { timeoutMs: 5000 });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.error).toBeUndefined();
  });

  it('returns not ok for unexpected status', async () => {
    global.fetch = mockFetch(500);
    const promise = checkEndpoint('https://example.com', { expectedStatus: 200 });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
  });

  it('handles fetch errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));
    const promise = checkEndpoint('https://broken.example.com');
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.ok).toBe(false);
    expect(result.status).toBeNull();
    expect(result.error).toMatch(/Network failure/);
  });

  it('includes url and timestamp in result', async () => {
    global.fetch = mockFetch(200);
    const promise = checkEndpoint('https://example.com/health');
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.url).toBe('https://example.com/health');
    expect(result.timestamp).toMatch(/^\d{4}-/);
  });
});

describe('isHealthy', () => {
  it('returns true for ok result with status', () => {
    expect(isHealthy({ url: 'u', status: 200, latencyMs: 50, ok: true, timestamp: '' })).toBe(true);
  });

  it('returns false when ok is false', () => {
    expect(isHealthy({ url: 'u', status: 500, latencyMs: 50, ok: false, timestamp: '' })).toBe(false);
  });

  it('returns false when status is null', () => {
    expect(isHealthy({ url: 'u', status: null, latencyMs: 50, ok: false, timestamp: '' })).toBe(false);
  });
});
