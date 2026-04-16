export interface ProbeConfig {
  method: string;
  headers: Record<string, string>;
  timeoutMs: number;
  retries: number;
  retryDelayMs: number;
}

const defaults: ProbeConfig = {
  method: "GET",
  headers: {},
  timeoutMs: 10000,
  retries: 0,
  retryDelayMs: 500,
};

export function parseProbeConfig(raw: Record<string, unknown>): Partial<ProbeConfig> {
  const out: Partial<ProbeConfig> = {};
  if (typeof raw.method === "string") out.method = raw.method.toUpperCase();
  if (raw.headers && typeof raw.headers === "object" && !Array.isArray(raw.headers)) {
    out.headers = raw.headers as Record<string, string>;
  }
  if (typeof raw.timeoutMs === "number" && raw.timeoutMs > 0) out.timeoutMs = raw.timeoutMs;
  if (typeof raw.retries === "number" && raw.retries >= 0) out.retries = raw.retries;
  if (typeof raw.retryDelayMs === "number" && raw.retryDelayMs >= 0) out.retryDelayMs = raw.retryDelayMs;
  return out;
}

export function applyProbeDefaults(partial: Partial<ProbeConfig>): ProbeConfig {
  return { ...defaults, ...partial };
}

export function probeSummary(cfg: ProbeConfig): string {
  const parts = [
    `method=${cfg.method}`,
    `timeout=${cfg.timeoutMs}ms`,
  ];
  if (cfg.retries > 0) parts.push(`retries=${cfg.retries} delay=${cfg.retryDelayMs}ms`);
  return `probe(${parts.join(", ")})`;
}
