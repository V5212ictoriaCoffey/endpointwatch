import type { WebhookConfig } from './webhook';

export interface WebhookConfigRaw {
  url?: unknown;
  method?: unknown;
  headers?: unknown;
  secret?: unknown;
}

export function parseWebhookConfig(raw: WebhookConfigRaw): WebhookConfig {
  if (typeof raw.url !== 'string' || !raw.url) {
    throw new Error('webhook config requires a valid url string');
  }
  const method = raw.method === 'PUT' ? 'PUT' : 'POST';
  const headers =
    raw.headers && typeof raw.headers === 'object' && !Array.isArray(raw.headers)
      ? (raw.headers as Record<string, string>)
      : undefined;
  const secret = typeof raw.secret === 'string' ? raw.secret : undefined;
  return { url: raw.url, method, headers, secret };
}

export function parseWebhookConfigs(raw: unknown): WebhookConfig[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    try {
      return parseWebhookConfig(item as WebhookConfigRaw);
    } catch (e: any) {
      throw new Error(`webhook[${i}]: ${e.message}`);
    }
  });
}

export function webhookSummary(configs: WebhookConfig[]): string {
  if (!configs.length) return 'webhooks: none';
  return configs.map((c) => `  - ${c.method ?? 'POST'} ${c.url}`).join('\n');
}
