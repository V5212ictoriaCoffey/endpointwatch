import { NotificationChannel } from './notifier';

export interface NotifierConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  minLevel: 'warning' | 'critical';
}

export const DEFAULT_NOTIFIER_CONFIG: NotifierConfig = {
  enabled: true,
  channels: [{ type: 'console' }],
  minLevel: 'warning',
};

export function parseNotifierConfig(raw: Record<string, unknown>): NotifierConfig {
  const config: NotifierConfig = { ...DEFAULT_NOTIFIER_CONFIG };

  if (typeof raw['notificationsEnabled'] === 'boolean') {
    config.enabled = raw['notificationsEnabled'];
  }

  if (raw['minAlertLevel'] === 'critical') {
    config.minLevel = 'critical';
  }

  if (Array.isArray(raw['channels'])) {
    const channels: NotificationChannel[] = [];
    for (const ch of raw['channels'] as Record<string, unknown>[]) {
      if (ch['type'] === 'console') {
        channels.push({ type: 'console' });
      } else if (ch['type'] === 'webhook' && typeof ch['url'] === 'string') {
        channels.push({ type: 'webhook', url: ch['url'] });
      }
    }
    if (channels.length > 0) {
      config.channels = channels;
    }
  }

  return config;
}

export function shouldNotify(
  config: NotifierConfig,
  level: 'warning' | 'critical'
): boolean {
  if (!config.enabled) return false;
  if (config.minLevel === 'critical' && level === 'warning') return false;
  return true;
}
