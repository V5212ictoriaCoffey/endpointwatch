import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendWebhook, dispatchWebhooks } from './webhook';
import type { AlertPayload } from './notifier';

const payload: AlertPayload = {
  endpoint: 'https://example.com',
  status: 'down',
  latency: 320,
  timestamp: '2024-01-01T00:00:00Z',
  message: 'timeout',
};

const mockFetch = (ok: boolean, status: number) =>
  vi.fn().mockResolvedValue({ ok, status });

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('sendWebhook', () => {
  it('returns ok on 200 response', async () => {
    vi.stubGlobal('fetch', mockFetch(true, 200));
    const result = await sendWebhook({ url: 'https://hook.example.com' }, payload);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  it('returns not ok on 500 response', async () => {
    vi.stubGlobal('fetch', mockFetch(false, 500));
    const result = await sendWebhook({ url: 'https://hook.example.com' }, payload);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
  });

  it('returns error on fetch throw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network fail')));
    const result = await sendWebhook({ url: 'https://hook.example.com' }, payload);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('network fail');
  });

  it('adds signature header when secret provided', async () => {
    const spy = mockFetch(true, 200);
    vi.stubGlobal('fetch', spy);
    await sendWebhook({ url: 'https://hook.example.com', secret: 'mysecret' }, payload);
    const headers = spy.mock.calls[0][1].headers;
    expect(headers['X-Webhook-Signature']).toBeDefined();
  });
});

describe('dispatchWebhooks', () => {
  it('sends to all configs', async () => {
    vi.stubGlobal('fetch', mockFetch(true, 200));
    const results = await dispatchWebhooks(
      [{ url: 'https://a.example.com' }, { url: 'https://b.example.com' }],
      payload
    );
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.ok)).toBe(true);
  });
});
