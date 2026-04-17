export interface SnapshotConfig {
  enabled: boolean;
  maxPerUrl: number;
  persistPath?: string;
}

const defaults: SnapshotConfig = {
  enabled: true,
  maxPerUrl: 100,
};

export function parseSnapshotConfig(raw: Record<string, unknown>): SnapshotConfig {
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : defaults.enabled,
    maxPerUrl:
      typeof raw.maxPerUrl === 'number' && raw.maxPerUrl > 0
        ? raw.maxPerUrl
        : defaults.maxPerUrl,
    persistPath: typeof raw.persistPath === 'string' ? raw.persistPath : undefined,
  };
}

export function applySnapshotDefaults(raw: Partial<SnapshotConfig>): SnapshotConfig {
  return { ...defaults, ...raw };
}

export function snapshotConfigSummary(cfg: SnapshotConfig): string {
  const parts = [`maxPerUrl=${cfg.maxPerUrl}`, `enabled=${cfg.enabled}`];
  if (cfg.persistPath) parts.push(`persist=${cfg.persistPath}`);
  return `SnapshotConfig(${parts.join(', ')})`;
}
