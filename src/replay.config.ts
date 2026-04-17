export interface ReplayConfig {
  from?: string;
  to?: string;
  limit?: number;
  endpointUrl?: string;
}

export interface ResolvedReplayOptions {
  from?: number;
  to?: number;
  limit?: number;
  endpointUrl?: string;
}

const DEFAULT_LIMIT = 100;

export function parseReplayConfig(raw: Record<string, unknown>): ReplayConfig {
  return {
    from: typeof raw.from === 'string' ? raw.from : undefined,
    to: typeof raw.to === 'string' ? raw.to : undefined,
    limit: typeof raw.limit === 'number' ? raw.limit : undefined,
    endpointUrl: typeof raw.endpointUrl === 'string' ? raw.endpointUrl : undefined,
  };
}

export function applyReplayDefaults(config: ReplayConfig): Required<Pick<ResolvedReplayOptions, 'limit'>> & ResolvedReplayOptions {
  return {
    ...config,
    from: config.from ? Date.parse(config.from) : undefined,
    to: config.to ? Date.parse(config.to) : undefined,
    limit: config.limit ?? DEFAULT_LIMIT,
  };
}

export function replaySummary(opts: ResolvedReplayOptions): string {
  const parts: string[] = [];
  if (opts.from) parts.push(`from=${new Date(opts.from).toISOString()}`);
  if (opts.to) parts.push(`to=${new Date(opts.to).toISOString()}`);
  if (opts.limit) parts.push(`limit=${opts.limit}`);
  if (opts.endpointUrl) parts.push(`url=${opts.endpointUrl}`);
  return `ReplayOptions(${parts.join(', ')})`;
}
