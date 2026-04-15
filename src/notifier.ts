import { AlertLevel } from './alerting';

export interface NotificationChannel {
  type: 'console' | 'webhook';
  url?: string;
}

export interface NotificationPayload {
  endpoint: string;
  alertLevel: AlertLevel;
  message: string;
  latency?: number;
  statusCode?: number;
  timestamp: string;
}

export async function sendConsoleNotification(payload: NotificationPayload): Promise<void> {
  const prefix = payload.alertLevel === 'critical' ? '[CRITICAL]' : '[WARNING]';
  console.error(
    `${prefix} ${payload.timestamp} | ${payload.endpoint} | ${payload.message}` +
    (payload.latency !== undefined ? ` | ${payload.latency}ms` : '') +
    (payload.statusCode !== undefined ? ` | HTTP ${payload.statusCode}` : '')
  );
}

export async function sendWebhookNotification(
  url: string,
  payload: NotificationPayload
): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    console.error(`[notifier] Webhook delivery failed: ${response.status} ${url}`);
  }
}

export async function notify(
  channels: NotificationChannel[],
  payload: NotificationPayload
): Promise<void> {
  for (const channel of channels) {
    if (channel.type === 'console') {
      await sendConsoleNotification(payload);
    } else if (channel.type === 'webhook' && channel.url) {
      await sendWebhookNotification(channel.url, payload);
    }
  }
}

export function buildPayload(
  endpoint: string,
  alertLevel: AlertLevel,
  message: string,
  latency?: number,
  statusCode?: number
): NotificationPayload {
  return {
    endpoint,
    alertLevel,
    message,
    latency,
    statusCode,
    timestamp: new Date().toISOString(),
  };
}
