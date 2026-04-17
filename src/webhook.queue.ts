import type { AlertPayload } from './notifier';
import type { WebhookConfig } from './webhook';
import { sendWebhook } from './webhook';

export interface QueuedWebhook {
  config: WebhookConfig;
  payload: AlertPayload;
  attempts: number;
  lastError?: string;
}

export interface WebhookQueue {
  enqueue(config: WebhookConfig, payload: AlertPayload): void;
  flush(maxRetries?: number): Promise<void>;
  pending(): number;
}

export function createWebhookQueue(): WebhookQueue {
  const queue: QueuedWebhook[] = [];

  return {
    enqueue(config, payload) {
      queue.push({ config, payload, attempts: 0 });
    },

    async flush(maxRetries = 3) {
      const remaining: QueuedWebhook[] = [];

      for (const item of queue) {
        const result = await sendWebhook(item.config, item.payload);
        if (result.ok) continue;

        item.attempts += 1;
        item.lastError = result.error ?? `HTTP ${result.status}`;
        if (item.attempts < maxRetries) {
          remaining.push(item);
        }
      }

      queue.length = 0;
      queue.push(...remaining);
    },

    pending() {
      return queue.length;
    },
  };
}
