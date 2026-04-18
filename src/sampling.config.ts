import { SamplingOptions } from './sampling';

export interface SamplingConfig {
  rate?: number;
  enabled?: boolean;
}

export const defaultSamplingConfig: Required<SamplingConfig> = {
  rate: 1.0,
  enabled: true,
};

export function parseSamplingConfig(raw: Record<string, unknown>): SamplingConfig {
  const config: SamplingConfig = {};
  if (typeof raw.samplingRate === 'number') config.rate = raw.samplingRate;
  if (typeof raw.samplingEnabled === 'boolean') config.enabled = raw.samplingEnabled;
  return config;
}

export function applySamplingDefaults(config: SamplingConfig): Required<SamplingConfig> {
  return {
    rate: config.rate ?? defaultSamplingConfig.rate,
    enabled: config.enabled ?? defaultSamplingConfig.enabled,
  };
}

export function toSamplingOptions(config: Required<SamplingConfig>): SamplingOptions | null {
  if (!config.enabled) return null;
  return { rate: config.rate };
}

export function samplingConfigSummary(config: Required<SamplingConfig>): string {
  if (!config.enabled) return 'sampling: disabled';
  return `sampling: enabled rate=${config.rate}`;
}
