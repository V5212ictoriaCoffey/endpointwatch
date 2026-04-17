import { describe, it, expect } from 'vitest';
import { parseWebhookConfig, parseWebhookConfigs, webhookSummary } from './webhook.config';

describe('parseWebhookConfig', () => {
  it('parses a minimal valid config', () => {
    const cfg = parseWebhookConfig({ url: 'https://example.com/hook' });
    expect(cfg.url).toBe('https://example.com/hook');
    expect(cfg.method).toBe('POST');
  });

  it('accepts PUT method', () => {
    const cfg = parseWebhookConfig({ url: 'https://example.com/hook', method: 'PUT' });
    expect(cfg.method).toBe('PUT');
  });

  it('throws on missing url', () => {
    expect(() => parseWebhookConfig({})).toThrow('valid url');
  });

  it('parses headers and secret', () => {
    const cfg = parseWebhookConfig({
      url: 'https://example.com',
      headers: { Authorization: 'Bearer token' },
      secret: 'abc123',
    });
    expect(cfg.headers?.Authorization).toBe('Bearer token');
    expect(cfg.secret).toBe('abc123');
  });
});

describe('parseWebhookConfigs', () => {
  it('returns empty array for non-array input', () => {
    expect(parseWebhookConfigs(null)).toEqual([]);
  });

  it('parses multiple configs', () => {
    const result = parseWebhookConfigs([
      { url: 'https://a.com' },
      { url: 'https://b.com' },
    ]);
    expect(result).toHaveLength(2);
  });

  it('throws with index on invalid entry', () => {
    expect(() => parseWebhookConfigs([{ url: '' }])).toThrow('webhook[0]');
  });
});

describe('webhookSummary', () => {
  it('returns none when empty', () => {
    expect(webhookSummary([])).toBe('webhooks: none');
  });

  it('lists each webhook', () => {
    const summary = webhookSummary([{ url: 'https://x.com', method: 'POST' }]);
    expect(summary).toContain('https://x.com');
  });
});
