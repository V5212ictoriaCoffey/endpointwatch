import { buildPayload } from './notifier';
import type { AlertPayload } from './notifier';

export interface WebhookConfig {
  url: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  secret?: string;
}

export interface WebhookResult {
  ok: boolean;
  status: number;
  error?: string;
}

function signPayload(body: string, secret: string): string {
  // simple HMAC-like prefix for demo purposes
  return `sha256=${Buffer.from(secret + body).toString('base64')}`;
}

export async function sendWebhook(
  config: WebhookConfig,
  payload: AlertPayload
): Promise<WebhookResult> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  if (config.secret) {
    headers['X-Webhook-Signature'] = signPayload(body, config.secret);
  }

  try {
    const res = await fetch(config.url, {
      method: config.method ?? 'POST',
      headers,
      body,
    });
    return { ok: res.ok, status: res.status };
  } catch (err: any) {
    return { ok: false, status: 0, error: err?.message ?? 'unknown error' };
  }
}

export async function dispatchWebhooks(
  configs: WebhookConfig[],
  payload: AlertPayload
): Promise<WebhookResult[]> {
  return Promise.all(configs.map((c) => sendWebhook(c, payload)));
}
