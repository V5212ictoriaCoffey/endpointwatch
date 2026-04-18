export interface MuteConfig {
  defaultDurationMs: number;
  autoMuteOnConsecutiveFailures?: number;
}

const DEFAULT_MUTE_CONFIG: MuteConfig = {
  defaultDurationMs: 5 * 60 * 1000, // 5 minutes
  autoMuteOnConsecutiveFailures: undefined,
};

export function parseMuteConfig(raw: Record<string, unknown>): MuteConfig {
  const cfg: MuteConfig = { ...DEFAULT_MUTE_CONFIG };
  if (typeof raw.defaultDurationMs === 'number') {
    cfg.defaultDurationMs = raw.defaultDurationMs;
  }
  if (typeof raw.autoMuteOnConsecutiveFailures === 'number') {
    cfg.autoMuteOnConsecutiveFailures = raw.autoMuteOnConsecutiveFailures;
  }
  return cfg;
}

export function applyMuteDefaults(raw: Partial<MuteConfig>): MuteConfig {
  return {
    defaultDurationMs: raw.defaultDurationMs ?? DEFAULT_MUTE_CONFIG.defaultDurationMs,
    autoMuteOnConsecutiveFailures:
      raw.autoMuteOnConsecutiveFailures ?? DEFAULT_MUTE_CONFIG.autoMuteOnConsecutiveFailures,
  };
}

export function muteConfigSummary(cfg: MuteConfig): string {
  const lines = [`Default mute duration: ${cfg.defaultDurationMs}ms`];
  if (cfg.autoMuteOnConsecutiveFailures !== undefined) {
    lines.push(`Auto-mute after ${cfg.autoMuteOnConsecutiveFailures} consecutive failures`);
  }
  return lines.join(', ');
}
