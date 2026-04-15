import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendConsoleNotification,
  sendWebhookNotification,
  notify,
  buildPayload,
  NotificationPayload,
} from './notifier';

function makePayload(overrides: Partial<NotificationPayload> = {}): NotificationPayload {
  return {
    endpoint: 'https://api.example.com/health',
    alertLevel: 'warning',
    message: 'High latency detected',
    latency: 850,
    statusCode: 200,
    timestamp: '2024-01-15T10:00:00.000Z',
    ...overrides,
  };
}

describe('sendConsoleNotification', () => {
  it('writes to stderr with WARNING prefix', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await sendConsoleNotification(makePayload({ alertLevel: 'warning' }));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[WARNING]'));
    spy.mockRestore();
  });

  it('writes to stderr with CRITICAL prefix', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await sendConsoleNotification(makePayload({ alertLevel: 'critical' }));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[CRITICAL]'));
    spy.mockRestore();
  });

  it('includes endpoint and message in output', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const payload = makePayload();
    await sendConsoleNotification(payload);
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain(payload.endpoint);
    expect(output).toContain(payload.message);
    spy.mockRestore();
  });
});

describe('sendWebhookNotification', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts JSON payload to the given URL', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({ ok: true } as Response);
    const payload = makePayload();
    await sendWebhookNotification('https://hooks.example.com/alert', payload);
    expect(mockFetch).toHaveBeenCalledWith('https://hooks.example.com/alert', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }));
  });

  it('logs error on non-ok response', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({ ok: false, status: 500 } as Response);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await sendWebhookNotification('https://hooks.example.com/alert', makePayload());
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('500'));
    spy.mockRestore();
  });
});

describe('buildPayload', () => {
  it('includes all provided fields', () => {
    const payload = buildPayload('https://api.example.com', 'critical', 'Down', 0, 503);
    expect(payload.endpoint).toBe('https://api.example.com');
    expect(payload.alertLevel).toBe('critical');
    expect(payload.message).toBe('Down');
    expect(payload.latency).toBe(0);
    expect(payload.statusCode).toBe(503);
    expect(payload.timestamp).toMatch(/^\d{4}-/);
  });
});

describe('notify', () => {
  it('dispatches to all configured channels', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true } as Response));
    await notify(
      [{ type: 'console' }, { type: 'webhook', url: 'https://hooks.example.com' }],
      makePayload()
    );
    expect(consoleSpy).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalled();
    consoleSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
