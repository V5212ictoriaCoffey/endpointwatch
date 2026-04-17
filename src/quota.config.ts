import type { QuotaOptions } from './quota';

export interface QuotaConfig {
  maxRequests?: number;
  windowMs?: number;
}

export const defaultQuotaConfig: Required<QuotaConfig> = {
  maxRequests: 60,
  windowMs: 60_000,
};

export function parseQuotaConfig(raw: Record<string, unknown>): QuotaConfig {
  const config: QuotaConfig = {};
  if (typeof raw.maxRequests === 'number') config.maxRequests = raw.maxRequests;
  if (typeof raw.windowMs === 'number') config.windowMs = raw.windowMs;
  return config;
}

export function applyQuotaDefaults(config: QuotaConfig): Required<QuotaConfig> {
  return { ...defaultQuotaConfig, ...config };
}

export function resolveQuotaOptions(raw: Record<string, unknown>): QuotaOptions {
  return applyQuotaDefaults(parseQuotaConfig(raw));
}

export function quotaSummary(options: QuotaOptions): string {
  return `quota: ${options.maxRequests} requests per ${options.windowMs}ms`;
}
